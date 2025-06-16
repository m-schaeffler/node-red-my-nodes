class BtEvent {
    constructor(prefix)
    {
        this._events = {};
        this._prefix = prefix;
    }
    pushEvent(type,event,data=null)
    {
        if( this._events[type] === undefined )
        {
            this._events[type] = [];
        }
        this._events[type].push( { event:event, data:data } );
    }
    eventMessages(name,channel)
    {
        function pushResult(type,event,index=null)
        {
            if( event.event && event.data !== "0" )
            {
                let payload  = { type: type, event: event.event };
                let indexStr = "";;
                if( channel !== null )
                {
                    indexStr += "/"
                    indexStr += channel;
                    payload.channel = channel;
                }
                if( index !== null )
                {
                    indexStr += "/";
                    indexStr += index;
                    payload.id = index;
                }
                if( event.data !== null )
                {
                    payload.data = event.data;
                }
                result.push( {
                    topic:   `${prefix}${name}${indexStr}/${event.event}`,
                    payload: payload
                } );
            }
        }

        let   result = [];
        const prefix = this._prefix;
        for( const t in this._events )
        {
            const event = this._events[t];
            if( event.length == 1 )
            {
                pushResult( t, event[0] );
            }
            else
            {
                for( const i in event )
                {
                    pushResult( t, event[i], Number( i ) + 1 );
                }
            }
        }
        return result;
    }
}

module.exports = BtEvent;
