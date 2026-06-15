// Utilities for use in NodeRed function nodes

exports.stripFirst = function(str,sep="/")
{
    let help = str.split( sep );
    help.shift();
    return help.join( sep );
}

exports.stripLast = function(str,sep="/")
{
    let help = str.split( sep );
    help.pop();
    return help.join( sep );
}

exports.sepStr = function(str=null)
{
    if( str !== "" )
        return "\u2009/\u2009";
    else
        return "";
}

exports.unitStr = function(unit)
{
    if( unit != "" )
        return `\u202F${unit}`;
    else
        return "";
}

exports.iconStr = function(icon)
{
    if( icon != "" )
    {
        return `<i style="line-height:130%" class=\"fa ${icon}\" aria-hidden=\"true\"/>`;
    }
    else
    {
        return "";
    }
}

exports.formatNumber = function(number,limit,unit="")
{
    switch( number )
    {
        case undefined:
            return "";
        case null:
            return "\u2014";
        default:
            return number.toFixed( number>limit ? 0 : 1 ) + exports.unitStr(unit);
    }
}

exports.number2color = function(number,low,high)
{
    if( number >= high )
        return 'green';
    else if( number < low )
        return 'red';
    else
        return '';
}

exports.int2CC = function(i,space=false)
{
    return i.toString().padStart( 2, space ? "\u2007" : "0" );
}

exports.int2CCC = function(i,space=false)
{
    return i.toString().padStart( 3, space ? "\u2007" : "0" );
}
