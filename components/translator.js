const americanOnly = require('./american-only.js');
const americanToBritishSpelling = require('./american-to-british-spelling.js');
const americanToBritishTitles = require("./american-to-british-titles.js")
const britishOnly = require('./british-only.js')

class Translator {

    reverseDict(dict) {
        return Object.assign({}, // target 
            ...Object.entries(dict).map(([key, value]) => ({
                [value]: key
            }))); // source
    }

    toBritishEnglish(text) {
        const dict = {...americanOnly, ...americanToBritishSpelling };
        const titles = americanToBritishTitles
        const timeRegex = /([1-9]|1[012]):[0-5][0-9]/g
        const translated = this.translate(
            text,
            dict,
            titles,
            timeRegex,
            'toBritish'
        )
        if (!translated) return text
        return translated
    }

    toAmericanEnglish(text) {
        const dict = {...britishOnly, ...this.reverseDict(americanToBritishSpelling) };
        const titles = this.reverseDict(americanToBritishTitles)
        const timeRegex = /([1-9]|1[012]).[0-5][0-9]/g
        const translated = this.translate(
            text,
            dict,
            titles,
            timeRegex,
            'toAmerican'
        )
        if (!translated) return text
        return translated
    }

    translate(text, dict, titles, timeRegex, locale) {
        const lowerText = text.toLowerCase()
        const matchesMap = {}

        // Search for titles/honorifics and add`em to the matchesMap object
        Object.entries(titles).map(([key, value]) => {
            if (lowerText.includes(key)) {
                matchesMap[key] = value.charAt(0).toUpperCase() + value.slice(1)
            }
        })

        // Filter words with spaces from current dictionary
        const wordsWithSpace = Object.fromEntries(
            Object.entries(dict).filter(([key, value]) => key.includes(' '))
        )

        // Search for spaced word matches and add`em to the matchesMap object
        Object.entries(wordsWithSpace).map(([key, value]) => {
            if (lowerText.includes(key)) {
                matchesMap[key] = value
            }
        })

        // Search for individual word matches and add`em to the matchesMap object
        lowerText.match(/(\w+([-'])(\w+)?['-]?(\w+))|\w+/g).forEach(word => {
            if (dict[word]) matchesMap[word] = dict[word]
        })

        // Search for time matches and add`em to the matchesMap object
        const matchedTimes = lowerText.match(timeRegex)

        if (matchedTimes) {
            matchedTimes.map(time => {
                if (locale === 'toBritish')
                    return matchesMap[time] = time.replace(':', '.')
                return matchesMap[time] = time.replace('.', ':')
            })
        }

        // No matches
        if (Object.keys(matchesMap).length === 0) return null

        //console.log('matchesMap', matchesMap)

        const translation = this.replaceAll(text, matchesMap)
        const translationWithHighlights = this.replaceAllWithHighlight(text, matchesMap)

        return [translation, translationWithHighlights]
    }

    replaceAll(text, matchesMap) {
        const re = new RegExp(Object.keys(matchesMap).join('|'), 'gi') // Regular expression for all keys in the matchesMap object g: global, i: case-insensitive
        return text.replace(re, matched => matchesMap[matched.toLowerCase()])
    }

    replaceAllWithHighlight(text, matchesMap) {
        const re = new RegExp(Object.keys(matchesMap).join('|'), 'gi')
        return text.replace(re, matched => {
            return `<span class="highlight">${matchesMap[matched.toLowerCase()]}</span>`
        })
    }

}

module.exports = Translator;