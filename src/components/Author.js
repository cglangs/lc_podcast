import React from 'react';
import gql from 'graphql-tag';
import { useQuery } from 'urql'
import { useMutation } from 'urql'
import '../styles/App.css';


export const GET_LEVEL_WORDS = gql`
  query GetLevelWords{
  Author{
    level{
      level_number
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

  function get_word_array(data, wordToTeach) {
  let arr = []
  if(wordToTeach && wordToTeach.text.length){
    console.log(wordToTeach,...data.Author[0].level.addable_words)
      arr = [wordToTeach, ...data.Author[0].level.addable_words]
    } else{
      arr = data.Author[0].level.teachable_words
    }
  return arr
  }



const Author = props => { 

  const [sentenceWords, setSentenceWords] = React.useState([])
  const [selectedWordId, setselectedWordId] = React.useState(null)
  const [wordToTeach, setWordToTeach] = React.useState({text: ''})
  const [shouldCall, setShouldCall] = React.useState(false)
  const [points, setPoints] = React.useState(0)




  const [addSentenceState, executeMutation] = useMutation(ADD_SENTENCE)
  const [result] = useQuery({ query: GET_LEVEL_WORDS})
  const {data} = result
  if(data){
    console.log(data,get_word_array(data, wordToTeach),selectedWordId,wordToTeach)

  }

  const submit = React.useCallback(() => {
    const sentenceWordList = sentenceWords.map(word => word.text)
    const rawSentenceText = sentenceWordList.join('')
    const displaySentenceText = rawSentenceText.replace(wordToTeach.text,"#")
    const wordToTeachText = wordToTeach.text
    const wordToTeachId = wordToTeach.word_id
    const variables = {rawSentenceText, displaySentenceText, wordToTeachText,wordToTeachId, sentenceWordList, currentInterval: data.Author[0].interval.interval_order, shouldCall}
    console.log(variables)
    executeMutation(variables).then(() => {
      setSentenceWords([])
      setWordToTeach({text: ''})
      setselectedWordId(null)
      if(data.Author[0].level.teachable_words.length === 0){
        setShouldCall(true)
      }
      props.history.push('/author')
    })
  }, [executeMutation, props.history, sentenceWords, wordToTeach, data, shouldCall])


  const appendWord = (newWord) => {setPoints(points => points + newWord.level.points); setSentenceWords(words => [...words, newWord])}
  const popWord = () => {setPoints(points => points - sentenceWords[sentenceWords.length - 1].level.points); setSentenceWords(words => words.slice(0,-1))}

  return (
    <div className="App">
      <header className="App-header">
      {data !== null ? (
          <div>
          <p style={{fontSize: "50px;"}}>{"Current Points: " + points}</p>
          <p style={{fontSize: "50px;"}}>Word being learned: {wordToTeach.text.length && wordToTeach.text}</p>
          <div>
          <p style={{fontSize: "30px;"}}>{sentenceWords.length ?  sentenceWords.map(word => word.text).join('') : null}</p>
           <button
            disabled={sentenceWords.length === 0}
            onClick={popWord}
            >
            Backspace
            </button>
          </div>
          <select onChange={e => setselectedWordId(parseInt(e.target.value))} value={selectedWordId}>
            <option selected value=''>Select Word</option>
            {data && get_word_array(data, wordToTeach).map(word => <option value={word.word_id}>{word.text}</option>)}
            </select>
           <button
            onClick={wordToTeach.text.length ? () => appendWord(get_word_array(data, wordToTeach).find(word=> word.word_id === selectedWordId)) : 
              () => setWordToTeach(get_word_array(data, wordToTeach).find(word=> word.word_id === selectedWordId))}
            >
            {wordToTeach.text.length ? "Add" : "Learn"}
            </button>
            <button
            onClick={() => submit()}
            disabled={addSentenceState.fetching || (wordToTeach.text.lengt && !sentenceWords.length)}
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

export default Author;

















//import { useMutation } from 'urql';



/*const ADD_WORD = gql`
  mutation AddWord($wordText: String!) {
    CreateWord(text: $wordText) {
      text
    }
  }
`*/



/*const WordList = () => {

  const [showWords, toggleShowWords] = React.useState(false)
  const [result, reexecuteQuery] = useQuery({ query: GET_WORDS })
  const { data, fetching, error } = result
  
  if (fetching) return <div>Fetching</div>
  if (error) return <div>Error</div>
  
  const words = data.wordlist

  const refresh = () => {
    // Refetch the query and skip the cache
    reexecuteQuery({ requestPolicy: 'network-only' });
  };



  return (
    <div>
     <button
        disabled={fetching}
        onClick={e=> toggleShowWords(!showWords)}
      >
        Show Words
      </button>
      <button
        disabled={fetching}
        onClick={e=> refresh()}
      >
        Refresh Words
      </button>
      {showWords ? words.map(word => <p>{word.text}</p>) : null}
    </div>
    )


}*/

  //const [wordText, setWordText] = React.useState('')
  //const [addWordState, executeMutation] = useMutation(ADD_WORD)

  /*const submit = React.useCallback(() => {
    executeMutation({wordText})
  }, [executeMutation, wordText])*/