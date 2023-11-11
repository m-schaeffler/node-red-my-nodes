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
