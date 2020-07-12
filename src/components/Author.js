import React, { Component } from 'react'
import gql from 'graphql-tag';
import { useMutation } from '@apollo/react-hooks';
import '../styles/App.css';


export const GET_LEVEL_WORDS = gql`
  query GetLevelWords{
  Author{
    level{
      level_number
      points
      teachable_words{
        text
        word_id
        level{
          points
        }
      }
      addable_words{
        text
        word_id
        level{
          points
        }
      }
    }
    interval{
      interval_order
      seconds
      min_length
      max_length
    }
  }
}
`

const ADD_SENTENCE = gql`
  mutation addsentence($rawSentenceText: String!, $displaySentenceText: String!, $wordToTeachText: String!, $wordToTeachId: Int!, $sentenceWordList: [String!], $currentInterval: Int!, $shouldCall: Boolean!) {
    CreateSentence(raw_text: $rawSentenceText, display_text: $displaySentenceText) {
      raw_text
    }
    AddSentenceLevel(from: {raw_text:  $rawSentenceText} to: {level_number: 1}){
      from {raw_text}
      to {level_number}
    }
    AddSentenceWord_taught(from: {raw_text: $rawSentenceText} to: {word_id: $wordToTeachId}){
      from {raw_text}
      to {text}
    }
    AddSentenceDependencies(src_sentence: $rawSentenceText, dest_words: $sentenceWordList, word_to_teach: $wordToTeachText){
      raw_text
      display_text
    }
    AddSentenceTime_interval(from: {raw_text: $rawSentenceText} to: {interval_order: $currentInterval}){
      from {raw_text}
      to {interval_order}
    }
    IncrementInterval(should_call: $shouldCall)
  }

`



class Author extends Component {
  state = {
    author: {},
    sentenceWords: [],
    selectedWordId: null,
    wordToTeach: {text: ''},
    shouldCall: false,
    points: 0

  }

  get_word_array() {
    let arr = []
    const {wordToTeach, author} = this.state
    if(wordToTeach && wordToTeach.text.length){
      console.log(wordToTeach,...author.level.addable_words)
        arr = [wordToTeach, ...author.level.addable_words]
      } else{
        arr = author.level.teachable_words
      }
    return arr
  }

  /*const [sentenceWords, setSentenceWords] = React.useState([])
  const [selectedWordId, setselectedWordId] = React.useState(null)
  const [wordToTeach, setWordToTeach] = React.useState({text: ''})
  const [shouldCall, setShouldCall] = React.useState(false)
  const [points, setPoints] = React.useState(0)*/


  submit() {
    const {sentenceWords, wordToTeach, shouldCall, author} = this.state
    const sentenceWordList = sentenceWords.map(word => word.text)
    const rawSentenceText = sentenceWordList.join('')
    const displaySentenceText = rawSentenceText.replace(wordToTeach.text,"#")
    const wordToTeachText = wordToTeach.text
    const wordToTeachId = wordToTeach.word_id
    const currentInterval = author.interval.interval_order
    const [addSentence] = useMutation(ADD_SENTENCE);

    addSentence({rawSentenceText,displaySentenceText,wordToTeachText,wordToTeachId,sentenceWordList,currentInterval,shouldCall }).then(() => {
      this.setState({sentenceWords: [], wordToTeach: {text: ''}, selectedWordId: null, points: 0})
      /*if(author.level.teachable_words.length === 0){
        setShouldCall(true)
      }*/
    })
  }

  appendWord(newWord) {
    this.setState(prevState => 
      ({points: prevState.points + newWord.points, sentenceWords: prevState.sentenceWords.push(newWord)}));
  }

  popWord() {
    this.setState(prevState => 
      ({
        points: prevState.points - prevState.sentenceWords[prevState.sentenceWords.length - 1], 
        sentenceWords: prevState.sentenceWords.slice(0,-1)
      }))
  }



  /*const [addSentenceState, executeMutation] = useMutation(ADD_SENTENCE)
  const [result] = useQuery({ query: GET_LEVEL_WORDS})
  const {data} = result*/

  /*const submit = React.useCallback(() => {
    const sentenceWordList = sentenceWords.map(word => word.text)
    const rawSentenceText = sentenceWordList.join('')
    const displaySentenceText = rawSentenceText.replace(wordToTeach.text,"#")
    const wordToTeachText = wordToTeach.text
    const wordToTeachId = wordToTeach.word_id
    const variables = {rawSentenceText, displaySentenceText, wordToTeachText,wordToTeachId, sentenceWordList, currentInterval: data.Author[0].interval.interval_order, shouldCall}
    executeMutation(variables).then(() => {
      setSentenceWords([])
      setWordToTeach({text: ''})
      setselectedWordId(null)
      if(data.Author[0].level.teachable_words.length === 0){
        setShouldCall(true)
      }
      props.history.push('/author')
    })
  }, [executeMutation, props.history, sentenceWords, wordToTeach, data, shouldCall])*/

  render() {
    const { sentenceWords, wordToTeach, author, points, selectedWordId} = this.state
    //const appendWord = (newWord) => {setPoints(points => points + newWord.level.points); setSentenceWords(words => [...words, newWord])}
    //const popWord = () => {setPoints(points => points - sentenceWords[sentenceWords.length - 1].level.points); setSentenceWords(words => words.slice(0,-1))}

    return (
      <div className="App">
        <header className="App-header">
        {Object.keys(author).length ? (
            <div>
            <p style={{fontSize: "50px;"}}>{"Current Points: " + points}</p>
            <p style={{fontSize: "50px;"}}>Word being learned: {wordToTeach.text.length && wordToTeach.text}</p>
            <div>
            <p style={{fontSize: "30px;"}}>{sentenceWords.length ?  sentenceWords.map(word => word.text).join('') : null}</p>
             <button
              disabled={sentenceWords.length === 0}
              onClick={this.popWord}
              >
              Backspace
              </button>
            </div>
            <select onChange={e => this.setState({selectedWordId: parseInt(e.target.value)})} value={selectedWordId}>
              <option selected value=''>Select Word</option>
              {this.get_word_array().map(word => <option value={word.word_id}>{word.text}</option>)}
              </select>
             <button
              onClick={wordToTeach.text.length ? () => this.appendWord(this.get_word_array().find(word=> word.word_id === selectedWordId)) : 
                () => this.setState({wordToTeach: this.get_word_array().find(word=> word.word_id === selectedWordId)})}
              >
              {wordToTeach.text.length ? "Add" : "Learn"}
              </button>
              <button
              onClick={this.submit}
              disabled={wordToTeach.text.length && !sentenceWords.length}
              >
              Submit
              </button>
              </div>
              ): (
              <div> 
                <button
                onClick={null}
                >
                Start next level
                </button>
              </div>)}
        </header>
        
      </div>
    
    );
  }
}

export default Author;
