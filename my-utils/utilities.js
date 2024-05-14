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

exports.formatTime = function(time)
{
    if( time )
    {
        const d     = (time instanceof Date) ? time : new Date( time );
        const delta = Date.now() - d;
        if( delta < 48*3600*1000 )
        {
            let min = d.getMinutes();
            if( min < 10 )
            {
                min = "0"+min;
            }
            return `${d.getHours()}:${min}`;
        }
        else
        {
            return `${d.getDate()}.${d.getMonth()+1}.`;
        }
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
