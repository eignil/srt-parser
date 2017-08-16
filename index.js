var SECOND = 1000
    , MINUTE = 60 * SECOND
    , HOUR = 60 * MINUTE
    , fs = require("fs")
    , partial = require("ap").partial
    , iterators = require("iterators")
    , reduce = iterators.reduceSync
    , map = iterators.mapSync
    , slice = Array.prototype.slice
    , extend = require("xtend")

srt.fromString = fromString
srt.merge = merge
srt.toString = toString

module.exports = srt

function srt(language, fileName, callback) {
    fs.readFile(fileName, partial(returnParsedData, language, callback))
}

function returnParsedData(language, callback, err, data) {
    if (err) {
        return callback(err)
    }

    callback(null, fromString(language, data.toString()))
}

function fromString(language, stringData) {
    var segments = stringData.split((stringData.search("\n\r\n") != -1) ? "\n\r\n" : "\n\n" )
    return reduce(segments, createSrtData, language, [])
}

function toString(json_data) {
    var str_data = ""
    var tmp=""
    for (var ele in json_data){
        tmp = srtData2String(json_data[ele])
        str_data += tmp;
        str_data += "\r\n"
    }
    return str_data;
}

function srtData2String(srtData){
    var str =srtData.number.toString()+"\n";
    str += time2String(srtData.startTime)+ " --> " + time2String(srtData.endTime)+"\n";
    for (var lan in srtData.languages){
        str += srtData.languages[lan]
        str += "\n"
    }
    return str
}

function createSrtData(memo, string) {
    var lines = string.split("\n")

    if (lines.length < 3) {
        return memo
    }

    var number = parseInt(lines[0], 10)
        , times = lines[1].split(" --> ")
        , startTime = parseTime(times[0])
        , endTime = parseTime(times[1])
        , text = lines.slice(2).join("\n")
        , languages = {}

    languages[this] = text

    memo.push({
        number: number
        , startTime: startTime
        , endTime: endTime
        , languages: languages
    })

    return memo
}

function parseTime(timeString) {
    var chunks = timeString.split(":")
        , secondChunks = chunks[2].split(",")
        , hours = parseInt(chunks[0], 10)
        , minutes = parseInt(chunks[1], 10)
        , seconds = parseInt(secondChunks[0], 10)
        , milliSeconds = parseInt(secondChunks[1], 10)

    return HOUR * hours +
        MINUTE * minutes +
        SECOND * seconds +
        milliSeconds
}

function time2String(time_val) {
    if (typeof(time_val)=="string"){
        time_val = parseInt(time_val,10);
    }
    var hours = Math.floor(time_val/HOUR)
        , minutes = Math.floor((time_val%HOUR)/MINUTE)
        , seconds = Math.floor((time_val%MINUTE)/SECOND)
        , milliSeconds = time_val%SECOND;

    var time_str = hours.toString() + ':' + minutes.toString() + ':' + seconds.toString() + ',' + milliSeconds.toString();

    return time_str;
}

function merge(srt) {
    var srts = slice.call(arguments)

    return reduce(srts, mixTogether)
}

function mixTogether(srtOne, srtTwo) {
    return map(srtOne, insertOtherSrtLanguage, srtTwo)
}

function insertOtherSrtLanguage(caption, index) {
    var otherSrt = this
        , otherCaptions = this[index]
        , languages = extend({}, caption.languages, otherCaptions.languages)

    return {
        startTime: caption.startTime
        , endTime: caption.endTime
        , number: caption.number
        , languages: languages
    }
}
