module.exports = function(RED) {

    function Ws90Node(config) {
        RED.nodes.createNode(this,config);
        var node    = this;
        var context = this.context();
        this.contextStore = config.contextStore ?? "none";
        this.refheight    = Number( config.refheight ?? 0 );
        this.last         = {};
        this.storage      = {};
        node.status( "" );
        if( node.contextStore !== "none" )
        {
            context.get( "storage", node.contextStore, function(err,value)
            {
                if( err )
                {
                    node.error( err );
                }
                else
                {
                    console.log( "context read", value );
                    if( value !== undefined )
                    {
                        node.storage = value;
                    }
                }
            } );
        }

        function ampel(value,v1,v2,s1="")
        {
            return value <= v1 ? s1 : ( value <= v2 ? "yellowValue" : "redValue" );
        }

        function setStorage(topic,value)
        {
            node.storage[topic] = value;
            context.set( "storage", node.storage, node.contextStore );
        }

        function genMessage(name,value,style=null)
        {
            if( node.last[name]?.value !== value || node.last[name]?.style !== style )
            {
                node.last[name] = { value:value, style:style };
                let result = { topic: name, payload: value };
                if( style !== null )
                {
                    result.ui_update = { class: style };
                }
                return result;
            }
            else
            {
                return null;
            }
        }

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
            }
            else if( msg.reset || msg.topic==="init" )
            {
                node.last = {};
            }
            else if( msg.newday || msg.topic==="newday" )
            {
                setStorage( "RegenGestern", node.storage.RegenHeute );
                setStorage( "RegenHeute",   0                       );
                setStorage( "WindMax",      0                       );
            }
            else if( typeof msg.payload !== "object" || msg.payload.temperature === undefined )
            {
                node.error( "invalid payload "+msg.payload );
            }
            else
            {
                const now = Date.now();

                // Luftdruck https://de.wikipedia.org/wiki/Barometrische_H%C3%B6henformel
                //const E = temperature >= 9.1 ? 18.219 * ( 1.0463 - Math.exp( -0.0666 * temperature ) ) : 5.6402 * ( Math.exp( 0.06 * temperature ) - 0.0916 );
                const p_H2O = ( 6.112 * Math.exp((17.62 * msg.payload.temperature) / ( msg.payload.temperature + 243.12)) * msg.payload.humidity) / 100; // Partialdruck Wasserdampf https://www.schweizer-fn.de/lueftung/feuchte/feuchte.php
                const h = node.refheight; // Ortshöhe
                const normdruck = msg.payload.pressure * Math.exp( 9.80665 / ( 287.05 * ( 273.15 + msg.payload.temperature + 0.12 * p_H2O + 0.0065 * h / 2 ) ) * h );

                node.status( Math.round( normdruck ) );
                send( [
                    genMessage( "Aussentemperatur", msg.payload.temperature ),
                    genMessage( "Taupunkt",         msg.payload.dewpoint ),
                    genMessage( "Luftfeuchtigkeit", msg.payload.humidity ),
                    genMessage( "Raining",          raining ),
                    genMessage( "Regen_gestern",    storage.RegenGestern ),
                    genMessage( "Regen_heute",      storage.RegenHeute, msg.payload.moisture ? "blueValue" : "" ),
                    genMessage( "UV-Index",         msg.payload.uv, ampel( msg.payload.uv, 2, 5, "greenValue" ) ),
                    genMessage( "Luftdruck",        normdruck ),
                    genMessage( "Windrichtung",     msg.payload.direction ),
                    genMessage( "Wind",             wind, ampel( wind, 25, 50 ) ),
                    genMessage( "Wind_max",         storage.WindMax ),
                    genMessage( "Helligkeit",       msg.payload.lux )
                ] );
            }
            done();
        });
    }

    RED.nodes.registerType( "ws90", Ws90Node );
}
