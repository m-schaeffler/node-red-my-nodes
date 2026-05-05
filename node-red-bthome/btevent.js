class BtEvent {
    static eventLut = {
        9: {
            button: ["left","right"]
        }
    };
    constructor(prefix,item,state)
    {
        this._events = {};
        this._prefix = prefix;
        this._item   = item;
        this._state  = state;
        console.log(this._state);
    }
    pushEvent(type,event,data=null)
    {
        if( this._events[type] === undefined )
        {
            this._events[type] = [];
        }
        this._events[type].push( { event:event, data:data } );
    }
    eventMessages(name,data)
    {
        function pushResult(type,event,index=null)
        {
        console.log("pr",state)
            if( ( event.event && event.data !== 0 ) || state )
            {
                let payload  = { ...data, type: type, event: event.event };
                let indexStr = "";;
                if( data?.channel !== undefined )
                {
                    indexStr += "/";
                    indexStr += data.channel;
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
        const state  = this._state;
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
