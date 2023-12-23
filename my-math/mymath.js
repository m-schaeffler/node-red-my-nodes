// Math functions for use in NodeRed function nodes

exports.compare = function(a,b)
{
    return a == b ? 0 : ( a > b ? +1 : -1 );
}

exports.linear = function(a,a1,a2,b1,b2)
{
    return a < a1 ? b1 :
           a > a2 ? b2 :
           b1 + (a-a1)*(b2-b1)/(a2-a1);
}

exports.interpolate = function(input,curve)
{
    if( input > curve[0].input )
    {
        for( let i = 1; i<curve.length; i++ )
        {
            if( input <= curve[i].input )
            {
                const help1 = curve[i-1];
                const help2 = curve[i];
                return help1.output + (input-help1.input)*(help2.output-help1.output)/(help2.input-help1.input);
            }
        }
        // größer als letzter Punkt
        const help = curve[curve.length-1];
        return input + help.output - help.input;
    }
    else
    {
        // kleiner als erster Punkt
        const help = curve[0];
        return input + help.output - help.input;
    }
}

exports.clamp = function(value,min,max)
{
    return value > max ? max : ( value < min ? min : value );
}
