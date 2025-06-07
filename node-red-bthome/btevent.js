class BtEvent {
    constructor(prefix)
    {
        this._events = {};
        this._prefix = prefix;
    }
    pushEvent(type,event,data=null)
    {
        if( event && data !== null )
        {
            event = `${event}|${data}`;
        }
        switch( typeof this._events[type] )
        {
            case "undefined":
                this._events[type] = event;
                break;
            case "string":
                this._events[type] = [this._events[type]];
                // fall through
            case "object":
                this._events[type].push( event );
                break;
        }
    }
    eventMessages(name)
    {
        function pushResult(type,event,index=null)
        {
            if( event )
            {
                const help    = event.split( '|' );
                let   payload = { type: type, event: help[0] };
                let   topic;
                if( index === null )
                {
                    topic = `${prefix}${name}/${help[0]}`;
                }
                else
                {
                    topic = `${prefix}${name}/${index}/${help[0]}`;
                    payload.id = index;
                }
                if( help[1] !== undefined )
                {
                    payload.data = help[1];
                }
                result.push( {
                    topic:   topic,
                    payload: payload
                } );
            }
        }

        let   result = [];
        const prefix = this._prefix;
        for( const t in this._events )
        {
            const event = this._events[t];
            if( typeof event == "string" )
            {
                pushResult( t, event );
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
