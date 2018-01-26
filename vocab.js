

var group10 = ['whereby', 'inclination', 'encountered', 'convinced', 
'assembly', 'albeit', 'enormous', 'reluctant', 'posed', 
'persistent', 'undergo', 'notwithstanding', 'straightforward', 
'panel', 'odd', 'intrinsic', 'compiled', 'adjacent', 'integrity', 
'forthcoming', 'conceived', 'ongoing', 'so-called', 'likewise', 
'nonetheless', 'levy', 'invoked', 'colleagues', 'depression', 'collapse'];



function Vocab() {

}

Vocab.nextWord = function() {
    var idx = Math.floor(Math.random()*group10.length);
    return group10[idx];
}

Vocab.translateEngVie = function(word) {
    return 'https://vdict.com/' + word + ',1,0,0.html';
}

Vocab.dictionaryEng = function(word) {
    return 'http://www.dictionary.com/browse/' + word;
}

exports.Vocab = Vocab;