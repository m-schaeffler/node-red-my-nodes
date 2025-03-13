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

exports.date2Format = function(date,format)
{
    let out = "";
    for( const c of format )
    {
        switch( c )
        {
            case "Y":
                out += date.getFullYear();
                break;
            case "m":
                out += date.getMonth() + 1;
                break;
            case "M":
                out += exports.int2CC( date.getMonth() + 1 );
                break;
            case "µ":
                out += exports.monthName( date );
                break;
            case "d":
                out += date.getDate();
                break;
            case "D":
                out += exports.int2CC( date.getDate() );
                break;
            case "h":
                out += date.getHours();
                break;
            case "H":
                out += exports.int2CC( date.getHours() );
                break;
            case "n":
                out += date.getMinutes();
                break;
            case "N":
                out += exports.int2CC( date.getMinutes() );
                break;
            case "s":
                out += date.getSeconds();
                break;
            case "S":
                out += exports.int2CC( date.getSeconds() );
                break;
            case "w":
                out += exports.dayName( date );
                break;
            case "W":
                out += exports.getWeek( date );
                break;
            default:
                out += c;
        }
    }
    return out;
}

exports.date2FormatUTC = function(date,format)
{
    let out  = "";
    let mask = false;
    for( const c of format )
    {
        switch( mask ? " " : c )
        {
            case '\\':
                mask = true;
                break;
            case "Y":
                out += date.getUTCFullYear();
                break;
            case "m":
                out += date.getUTCMonth() + 1;
                break;
            case "M":
                out += exports.int2CC( date.getUTCMonth() + 1 );
                break;
            case "d":
                out += date.getUTCDate();
                break;
            case "D":
                out += exports.int2CC( date.getUTCDate() );
                break;
            case "h":
                out += date.getUTCHours();
                break;
            case "H":
                out += exports.int2CC( date.getUTCHours() );
                break;
            case "n":
                out += date.getUTCMinutes();
                break;
            case "N":
                out += exports.int2CC( date.getUTCMinutes() );
                break;
            case "s":
                out += date.getUTCSeconds();
                break;
            case "S":
                out += exports.int2CC( date.getUTCSeconds() );
                break;
            default:
                out += c;
        }
        mask = false;
    }
    return out;
}

exports.date2dateStr = function(date)
{
    return exports.date2Format( date, "D:M:Y" ); //`${exports.int2CC(date.getDate())}:${exports.int2CC(date.getMonth()+1)}:${date.getFullYear()}`;
}

exports.date2timeStr = function(date,space=true)
{
    return exports.date2Format( date, space ? "h:N" : "H:N" ); //`${exports.int2CC(date.getHours(),space)}:${exports.int2CC(date.getMinutes())}`;
}

exports.formatTime = function(time)
{
    if( time )
    {
        const d     = (time instanceof Date) ? time : new Date( time );
        const delta = Date.now() - d;
        return exports.date2Format( d, delta < 48*3600*1000 ? "h:N" : "d.M." ); //`${d.getDate()}.${d.getMonth()+1}.`;
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

// Date/Time

exports.weekdays = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
exports.dayName = function(date)
{
    return exports.weekdays[date.getDay()];
}

exports.months = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
exports.monthName = function(date)
{
    return exports.months[date.getMonth()];
}

function donnerstag(datum)
{
    return new Date( datum.getTime() + ( 3 - ( ( datum.getDay() + 6 ) % 7 ) ) * 86400000 );
}

exports.getWeek = function(date)
{
    const DoDat = donnerstag( date );
    const DoKW1 = donnerstag( new Date( DoDat.getFullYear(), 0, 4 ) );
    return Math.floor( 1.5 + ( DoDat.getTime() - DoKW1.getTime()) / 86400000 / 7 );
}
