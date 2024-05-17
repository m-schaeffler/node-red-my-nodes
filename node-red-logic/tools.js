// general functions

exports.property2boolean = function(input)
{
    switch( input )
    {
        case true:
        case 1:
        case "1":
        case "true":
        case "on":
            return true;
        case false:
        case 0:
        case "0":
        case "false":
        case "off":
        case "overpower":
            return false;
        default:
            return null;
    }
}

exports.prepareProperty = function(node)
{
    if( node.propertyType === "jsonata" )
    {
        try {
            node.propertyPrepared = RED.util.prepareJSONataExpression( node.property, node );
        }
        catch (e) {
            node.error( RED._( "debug.invalid-exp", {error:node.property} ) );
            return;
        }
    }
}

exports.getPayload = function(node,msg,callback)
{
    if( node.propertyPrepared )
    {
        RED.util.evaluateJSONataExpression( node.propertyPrepared, msg, function(err, value)
        {
            if( err )
            {
                node.done( RED._( "debug.invalid-exp", {error:node.property} ) );
            }
            else
            {
                callback( value );
            }
        } );
    }
    else
    {
        callback( RED.util.getMessageProperty( msg, node.property ) );
    }
}

exports.convertTypedInput = function(value,type)
{
    switch( type )
    {
        case "num":
            return Number( value );
        case "bool":
            return exports.property2boolean( value );
        case "json":
            return JSON.parse( value );
        default:
            return value;
    }
}

exports.distance = function(a,b)
{
    return a>b ? a-b : b-a;
}
