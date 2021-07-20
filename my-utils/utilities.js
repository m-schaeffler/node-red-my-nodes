// Utilities for use in NodeRed function nodes

exports.colorizeNumber = function(number,low,high,unit="")
{
    if( typeof number === 'number' )
    {
        let color = '';
        if( number >= high )
            color = 'color:lime';
        else if( number < low )
            color = 'color:red';
        let str = `<span style=\"${color}\">${number}`;
        if( unit != "" )
            str += `&thinsp;${unit}`;
        return `${str}</span>`;
    }
    else
    {
        return "";
    }
}

exports.colorizeTime = function(time)
{
    const d     = new Date( time );
    const delta = Date.now() - d;
    let   color = "";
    let   min   = d.getMinutes();
    let   str;
    if( delta < 3*3600*1000 )
    {
        color = "color:lime";
    }
    else if( delta > 24*3600*1000 )
    {
        color = "color:red";
    }
    if( delta < 48*3600*1000 )
    {
        if( min < 10 )
        {
            min = "0"+min;
        }
        str = `${d.getHours()}:${min}`;
    }
    else
    {
        str = `${d.getDate()}.${d.getMonth()+1}.`;
    }
    return `<span style=\"${color}\">${str}</span>`;
}
