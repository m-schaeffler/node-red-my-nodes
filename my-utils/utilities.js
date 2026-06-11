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

exports.timestamp2zdt = function(timestamp)
{
    return timestamp ? Temporal.Instant.fromEpochMilliseconds( timestamp ).toZonedDateTimeISO( Temporal.Now.timeZoneId() ) : null;
}

exports.date2Format = function(zdt,format)
{
    let out  = "";
    let mask = false;
    for( const c of format )
    {
        if( mask )
        {
            out += c;
            mask = false;
        }
        else
        {
            switch( c )
            {
                case "\\":
                    mask = true;
                    break;
                case "Y":
                    out += zdt.year;
                    break;
                case "m":
                    out += zdt.month;
                    break;
                case "M":
                    out += exports.int2CC( zdt.month );
                    break;
                case "b":
                    out += exports.monthName( zdt );
                    break;
                case "B":
                    out += exports.monthName( zdt, true );
                    break;
                case "d":
                    out += zdt.day;
                    break;
                case "D":
                    out += exports.int2CC( zdt.day );
                    break;
                case "h":
                    out += zdt.hour;
                    break;
                case "H":
                    out += exports.int2CC( zdt.hour );
                    break;
                case "n":
                    out += zdt.minute;
                    break;
                case "N":
                    out += exports.int2CC( zdt.minute );
                    break;
                case "s":
                    out += zdt.second;
                    break;
                case "S":
                    out += exports.int2CC( zdt.second );
                    break;
                case "F":
                    out += exports.int2CCC( zdt.millisecond );
                    break;
                case "w":
                    out += zdt.dayOfWeek;
                    break;
                case "a":
                    out += exports.dayName( zdt );
                    break;
                case "A":
                    out += exports.dayName( zdt, true );
                    break;
                case "W":
                    out += zdt.weekOfYear;
                    break;
                case "z":
                    out += zdt.timeZoneId;
                    break;
                default:
                    out += c;
            }
        }
    }
    return out;
}

exports.date2dateStr = function(date)
{
    return exports.date2Format( date, "D:M:Y" );
}

exports.date2timeStr = function(date,space=true)
{
    return exports.date2Format( date, space ? "h:N" : "H:N" );
}

exports.formatTime = function(zdt)
{
    if( zdt )
    {
        const delta = zdt.until( Temporal.Now.zonedDateTimeISO() ).total( "days" );
        return exports.date2Format( zdt, delta < 2 ? "h:N" : "d.M." );
    }
    else
    {
        return "";
    }
}

exports.time2color = function(zdt,ok=3,nok=24)
{
    if( zdt )
    {
        const delta = zdt.until( Temporal.Now.zonedDateTimeISO() ).total( "hours" );
        if( delta < ok )
        {
            return "green";
        }
        else if( delta > nok )
        {
            return "red";
        }
    }
    return "";
}

// Date/Time

exports.weekdays = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
exports.weekdaysLong = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
exports.dayName = function(zdt,long=false)
{
    return long ? exports.weekdaysLong[zdt.dayOfWeek] : exports.weekdays[zdt.dayOfWeek];
}

exports.months = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
exports.monthsLong = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
exports.monthName = function(zdt,long)
{
    return long ? exports.monthsLong[zdt.month-1] : exports.months[zdt.month-1];
}
