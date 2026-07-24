// SendQueue

class SendQueue {
    constructor()
    {
        this.counter = 0;
        this.ack     = 0;
        this.socket  = null;
    }

    open(url)
    {
        this.socket = new WebSocket( url );
        return this.socket;
    }

    close()
    {
        if( this.socket )
        {
            this.socket.close();
            this.socket = null;
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

    sendCommand(command,id,args)
    {
        if( this.socket )
        {
            this.socket.send( JSON.stringify( {
                message_id: `${command}|${id}|${++this.counter}`,
                command:    command,
                args:       args
            } ) );
            console.log("  send",this.counter)
        }
        else
        {
            throw new Error( "websocket is closed" );
        }
    }

    acknowledgeCommand(message_id)
    {
        const [message,param,seqStr] = message_id.split( "|" );
        this.ack = Number( seqStr );
        console.log("    ack",this.ack)
        return [message,param];
    }

    isEmpty()
    {
        return this.counter == this.ack;
    }
}

// Export

module.exports = SendQueue;
