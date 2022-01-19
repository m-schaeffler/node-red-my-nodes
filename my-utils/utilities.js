// Utilities for use in NodeRed function nodes

exports.sepStr = function(str=null)
{
    if( str !== "" )
        return "&thinsp;/&thinsp;";
    else
        return "";
}

exports.unitStr = function(unit)
{
    if( unit != "" )
        return `&thinsp;${unit}`;
    else
        return "";
}

exports.iconStr = function(icon)
{
    return `<i class=\"fa ${icon}\" aria-hidden=\"true\"/>`;
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

exports.colorizeValue = function(number,color,unit="")
{
    return `<span style=\"${color}\">${number}${exports.unitStr(unit)}</span>`;
}

exports.colorizeNumber = function(number,low,high,unit="")
{
    if( typeof number === 'number' )
    {
        let color = '';
        if( number >= high )
            color = 'color:lime';
        else if( number < low )
            color = 'color:red';
        return exports.colorizeValue( number, color, unit );
    }
    else
    {
        return "";
    }
}

exports.formatTime = function(time)
{
    const d   = (time instanceof Date) ? time : new Date( time );
    let   min = d.getMinutes();
    if( min < 10 )
    {
        min = "0"+min;
    }
    return `${d.getHours()}:${min}`;
}

exports.colorizeTime = function(time,ok=3,nok=24)
{
    const d     = new Date( time );
    const delta = Date.now() - d;
    let   color = "";
    if( delta < ok*3600*1000 )
    {
        color = "color:lime";
    }
    else if( delta > nok*3600*1000 )
    {
        color = "color:red";
    }
    return exports.colorizeValue( 
        delta < 48*3600*1000 ? exports.formatTime( d ) : `${d.getDate()}.${d.getMonth()+1}.`, 
        color );
}
