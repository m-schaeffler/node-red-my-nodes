class BtEvent {
    static eventLut = {
        0x020A: {
            button: ["left","right"]
        }
    };
    constructor(prefix,item)
    {
        this._events = {};
        this._prefix = prefix;
        this._item   = item;
    }
    pushEvent(type,event,data=null)
    {
        if( this._events[type] === undefined )
        {
            this._events[type] = [];
        }
        this._events[type].push( { event:event, data:data } );
    }
    eventMessages(name,channel,indexLut)
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
                    pushResult(
                        t,
                        event[i],
                        BtEvent.eventLut[this._item.typeId]?.[t]?.[i] ?? Number( i ) + 1
                    );
                }
            }
        }
        return result;
    }
}

module.exports = BtEvent;
