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
    if( number !== undefined )
    {
        return number.toFixed( number>limit ? 0 : 1 ) + exports.unitStr(unit);
    }
    else
    {
        return "";
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
    return i < 10 ? ( space ? "\u2007" : "0" ) + i : i;
}

exports.int2CCC = function(i,space=false)
{
    return i < 100 ? ( space ? "\u2007" : "0" ) + exports.int2CC( i ) : i;
}

exports.date2dateStr = function(date)
{
    return `${exports.int2CC(date.getDate())}:${exports.int2CC(date.getMonth()+1)}:${date.getFullYear()}`;
}

exports.date2timeStr = function(date,space=true)
{
    return `${exports.int2CC(date.getHours(),space)}:${exports.int2CC(date.getMinutes())}`;
}

exports.formatTime = function(time)
{
    if( time )
    {
        const d     = (time instanceof Date) ? time : new Date( time );
        const delta = Date.now() - d;
        return delta < 48*3600*1000 ? exports.date2timeStr(d) : `${d.getDate()}.${d.getMonth()+1}.`;
    }
    else
    {
        return "";
    }
}

function intTime2color(delta,ok,nok)
{
    if( delta < ok*3600*1000 )
    {
        return "green";
    }
    else if( delta > nok*3600*1000 )
    {
        return "red";
    }
    else
    {
        return "";
    }
}

exports.time2color = function(time,ok=3,nok=24)
{
    const d     = new Date( time );
    const delta = Date.now() - d;
    return intTime2color( delta, ok, nok );
}
