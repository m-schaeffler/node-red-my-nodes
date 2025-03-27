module.exports = function(RED) {

    function FormatNumberNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.property     = config.property ?? "payload";
        this.propertyType = config.propertyType ?? "msg";
        this.unit         = config.unit ?? "";
        this.grouping     = config.grouping ?? "";
        this.decimal      = config.decimal ?? ".";
        this.digits       = Number( config.digits ?? 0 );
        this.showState    = Boolean( config.showState );
        this.filter       = Boolean( config.filter );
        this.last         = null;
        if( this.propertyType === "jsonata" )
        {
            try {
                this.propertyPrepared = RED.util.prepareJSONataExpression( this.property, this );
            }
            catch (e) {
                node.error(RED._("debug.invalid-exp", {error: this.property}));
                return;
            }
        }
        if( this.unit )
        {
            this.unit = "\u202F" + this.unit;
        }
        if( this.grouping )
        {
            this.grouping    = "$1" + this.grouping;
            this.groupRegExp = /(\d)(?=(\d{3})+(?!\d))/g;
        }
        node.status( "" );

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
                done();
                return;
            }
            function getPayload(callback)
            {
                if( node.propertyPrepared )
                {
                    RED.util.evaluateJSONataExpression( node.propertyPrepared, msg, function(err, value)
                    {
                        if( err )
                        {
                            //done( err.message );
                            node.error( err.message );
                            callback( null );
                        }
                        else
                        {
                            callback( value === undefined ? null : value );
                        }
                    } );
                }
                else
                {
                    try
                    {
                        callback( RED.util.getMessageProperty( msg, node.property ) );
                    }
                    catch( err )
                    {
                        node.error( err.message );
                        callback( null );
                    }
                }
            }
            getPayload( function(value)
            {
                const number = Number( value );
                let   status = {};
                if( ! ( Number.isNaN( number ) || value === null ) )
                {
                    const roundedNumber = number.toFixed( node.digits );
                    let integer,fractional;
                    if( node.digits == 0 )
                    {
                        integer    = roundedNumber;
                        fractional = "";
                    }
                    else
                    {
                        const numberParts = roundedNumber.split( '.' );
                        integer    = numberParts[0];
                        fractional = node.decimal + numberParts[1];
                    }
                    if( node.grouping )
                    {
                        integer = integer.replace( node.groupRegExp, node.grouping );
                    }
                    msg.payload = integer + fractional;
                    if( node.unit )
                    {
                        msg.payload += node.unit;
                    }
                }
                else
                {
                    msg.payload = value;
                }
                if( node.filter )
                {
                    status.shape = "dot";
                    if( msg.payload !== node.last )
                    {
                        node.last = msg.payload;
                        status.fill = "green";
                        send( msg );
                    }
                    else
                    {
                        status.fill = "gray";
                    }
                }
                else
                {
                    send( msg );
                }
                if( node.showState )
                {
                    status.text = msg.payload;
                    node.status( status );
                }
                done();
            } );
        });
    }

    RED.nodes.registerType("formatNumber",FormatNumberNode);
}
