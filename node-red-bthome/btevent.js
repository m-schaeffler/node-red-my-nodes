class BtEvent {
    constructor(prefix)
    {
        this._events = {};
        this._prefix = prefix;
    }
    pushEvent(type,event)
    {
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
        let result = [];
        for( const t in this._events )
        {
            const event = this._events[t];
            if( typeof event == "string" )
            {
                if( event )
                {
                    result.push( { topic: `${this._prefix}${name}/${event}`, payload: { type: t, event: event } } );
                }
            }
            else
            {
                for( const i in event )
                {
                    if( event[i] )
                    {
                        const index = Number( i ) + 1;
                        result.push( { topic: `${this._prefix}${name}/${index}/${event[i]}`, payload: { type: t, id: index, event: event[i] } } );
                    }
                }
            }
        }
        return result;
    }
}

module.exports = BtEvent;
