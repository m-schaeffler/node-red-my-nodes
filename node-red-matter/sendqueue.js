// SendQueue

class SendQueue {
    constructor()
    {
        this.counter     = 0;
        this.missingAcks = new Set();
        this.socket      = null;
        this.inflight    = {};
        this.queues      = {};
    }

    open(url)
    {
        this.socket = new WebSocket( url );
        this.missingAcks.clear();
        return this.socket;
    }

    close()
    {
        if( this.socket )
        {
            this.socket.close();
            this.socket = null;
            this.missingAcks.clear();
            return true;
        }
        else
        {
            return false;
        }
    }

    isOpened()
    {
        return this.socket != null;
    }

    _doSendCommand(msg)
    {
        if( this.socket )
        {
            this.socket.send( msg );
        }
        else
        {
            throw new Error( "websocket is closed" );
        }
    }

    sendCommand(command,id,args)
    {
        const msg = JSON.stringify( {
            message_id: `${command}|${id}|${++this.counter}|${args.node_id??0}`,
            command:    command,
            args:       args
        } );
        if( command == "device_command" )
        {
            this.queues[args.node_id] ??= [];
            if( this.inflight[args.node_id] )
            {
                this.queues[args.node_id].push( msg );
                console.log("  stored in queue",this.counter)
            }
            else
            {
                console.assert( this.queues[args.node_id].length == 0 );
                this.inflight[args.node_id] = true;
                this._doSendCommand( msg );
                console.log("  direct send",this.counter)
            }
        }
        else
        {
            this._doSendCommand( msg );
            console.log("  unqueued send",this.counter)
        }
        this.missingAcks.add( this.counter );
    }

    acknowledgeCommand(message_id)
    {
        const [command,param,seqStr,node_id] = message_id.split( "|" );
        const sequence = Number( seqStr );
        this.missingAcks.delete( sequence );
        console.log("    ack",sequence,`(${this.missingAcks.size})`)
        if( command == "device_command" )
        {
            console.assert( node_id > 0 );
            console.assert( this.inflight[node_id] );
            const next = this.queues[node_id].shift();
            if( next )
            {
                this.inflight[node_id] = true;
                this._doSendCommand( next );
                console.log("  queued send",)
            }
            else
            {
                 this.inflight[node_id] = false;
            }
        }
        return [command,param];
    }

    isEmpty()
    {
        return this.missingAcks.size == 0;
    }
}

// Export

module.exports = SendQueue;
