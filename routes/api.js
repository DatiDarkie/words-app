const { Router } = require("express");
const { users, categories } = require('../config');
const router = Router();

module.exports = function (qb) {
  router.post('/words', (req, res) => {
    const wordsQuery = qb.select('*').from('words');
    let { searchQuery, sortBy, category, writer } = req.body;

    wordsQuery.exec().then(words => {
      if (typeof searchQuery === 'string' && searchQuery.trim() !== '') {
        searchQuery = searchQuery.toLowerCase();
        words = words.filter(w => {
          return (
            w.word.toLowerCase().includes(searchQuery) ||
            w.word_translate.toLowerCase().includes(searchQuery)
          );
        });
      }

      if (sortBy) {
        let langISO = sortBy.slice(0, 2), _sortBy = sortBy.slice(2), prop = langISO === 'ar' ? 'word_translate' : 'word';
        words = words.sort((a, b) => {
          if (_sortBy === 'DESC') {
            return b[prop].at(0).localeCompare(a[prop].at(0), langISO);
          } else {
            return a[prop].at(0).localeCompare(b[prop].at(0), langISO);
          }
        });
      }
      
      res.json(words.filter(w => {
        if (writer && w.writer !== writer) {
          return false;
        } else if (category && w.category !== category) {
          return false;
        } else {
          return true;
        }
      }));
    });
  });

  router.post('/words/add', async (req, res) => {
    let { word, word_translate, category, writer } = req.body, message = null;
    const wordsQuery = qb.select('*').from('words');
    let words = await wordsQuery.exec(), wordData = {
      word,
      word_translate,
      category,
      writer
    };
    
    message = checkWordValidation(wordData, words);
    message ? res.status(400).json({ message }) : qb.insert('words', wordData).exec().then(() => res.status(200).json(wordData));
  });

  router.put('/words/:word_id', async (req, res) => {
    let { word, word_translate, category, writer } = req.body, message = null;
    const wordsQuery = qb.select('*').from('words');
    let words = await wordsQuery.exec(), wordData = {
      word,
      word_translate,
      category,
      writer
    };
    
    message = checkWordValidation(wordData, words, req.params.word_id);
    message ? res.status(400).json({ message }) : qb.update('words', wordData).where({ id: req.params.word_id }).exec().then(() => res.status(200).json(wordData));
  });

  router.delete('/words/:word_id', (req, res) => {
    qb.delete("words", { id: req.params.word_id }).exec().then((data) => res.status(200).json(data));
  });

  return router;
}

function checkWordValidation({ word, word_translate, category, writer }, words, id) {
  let message = '';
  
  !word && (message = 'Word field is required!');
  !message && !word_translate && (message = 'Word translate field is required!');

  if (!message && typeof writer === 'string' && !users.map(e => e.name).includes(writer)) {
    return res.status(400).json({ message: 'The user "' + writer + '" isn\'t registered' });
  }

  if (!message && !categories.map(c => c.value).includes(category)) {
    message = category ? 'Category data isn\'t valid!' : 'Category is required!';
  }

  !message && (word.length > 32 || word.length < 1) && (message = 'Word length should be between 1-32');
  !message && (word_translate.length > 32 || word_translate.length < 1) && (message = 'Word translate length should be between 1-32');

  if (words.find(w => w.word.toLowerCase() === word.toLowerCase() && id != w.id)) { message = 'This word has already been added!'; }

  return message;
}