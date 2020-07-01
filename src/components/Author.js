import React from 'react';
import gql from 'graphql-tag';
import { useQuery } from 'urql'
import { useMutation } from 'urql'
import '../styles/App.css';


export const GET_EPISODE_WORDS = gql`
  query GetEpisodeWords{
  Author{
    episode{
      episode_number
      teachable_words{
        text
      }
      addable_words{
        text
      }
    }
    interval{
      interval_order
      seconds
    }
  }
}
`

const ADD_SENTENCE = gql`
  mutation addsentence($rawSentenceText: String!, $displaySentenceText: String!, $wordToTeach: String!, $sentenceWordList: [String!], $currentInterval: Int!, $shouldCall: Boolean!) {
    CreateSentence(raw_text: $rawSentenceText, display_text: $displaySentenceText) {
      raw_text
    }
    AddSentenceEpisode(from: {raw_text:  $rawSentenceText} to: {episode_number: 1}){
      from {raw_text}
      to {episode_number}
    }
    AddSentenceWord_taught(from: {raw_text: $rawSentenceText} to: {text: $wordToTeach}){
      from {raw_text}
      to {text}
    }
    AddSentenceDependencies(src_sentence: $rawSentenceText, dest_words: $sentenceWordList, word_to_teach: $wordToTeach){
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

/*const CHANGE_INTERVAL = gql`
  mutation changeInterval {
    IncrementInterval
  }
`*/
//Create relation between sentence and word
//Create relation between sentence and episode

  function displayWordDropDown(episode, wordToTeach) {
  let arr = []
  if(wordToTeach){
      arr = [{text:wordToTeach}, ...episode.addable_words]
    } else{
      arr = episode.teachable_words
    }
  return arr
  }


const Author = props => { 

  const [sentenceWords, setSentenceWords] = React.useState([])
  const [selectedWord, setSelectedWord] = React.useState('')
  const [wordToTeach, setWordToTeach] = React.useState('')
  const [shouldCall, setShouldCall] = React.useState(false)


  const [addSentenceState, executeMutation] = useMutation(ADD_SENTENCE)
  //const [incrementIntervalState, executeIntervalMutation] = useMutation(CHANGE_INTERVAL)
  const [result] = useQuery({ query: GET_EPISODE_WORDS})
  const {data} = result

  /*if(data && data.Author[0].episode.teachable_words.length === 0){
    executeIntervalMutation()
    props.history.push('/author')
  }*/

  const submit = React.useCallback(() => {
    const rawSentenceText = sentenceWords.join('')
    const displaySentenceText = rawSentenceText.replace(wordToTeach,"#")
    const sentenceWordList = sentenceWords
    const variables = {rawSentenceText, displaySentenceText, wordToTeach, sentenceWordList, currentInterval: data.Author[0].interval.interval_order, shouldCall}
    executeMutation(variables).then(() => {
      setSentenceWords([])
      setWordToTeach('')
      setSelectedWord('')
      if(data.Author[0].episode.teachable_words.length === 0){
        setShouldCall(true)
      }
      props.history.push('/author')
    })
  }, [executeMutation, props.history, sentenceWords, wordToTeach, data, shouldCall])



  const appendWord = (newWord) => setSentenceWords(words => [...words, newWord])
  const popWord = () => setSentenceWords(words => words.slice(0,-1))

  return (
    <div className="App">
      <header className="App-header">
      {data !== null ? (
          <div>
          <p style={{fontSize: "50px;"}}>{"Word being learned: " + wordToTeach}</p>
          <div>
          <p style={{fontSize: "30px;"}}>{sentenceWords.length ?  sentenceWords.join('') : null}</p>
           <button
            disabled={sentenceWords.length === 0}
            onClick={popWord}
            >
            Backspace
            </button>
          </div>
          <select onChange={e => setSelectedWord(e.target.value)} value={selectedWord}>
            <option selected value=''>Select Word</option>
            {data && displayWordDropDown(data.Author[0].episode,wordToTeach).map(word => <option value={word.text}>{word.text}</option>)}
            </select>
           <button
            onClick={wordToTeach.length ? () => appendWord(selectedWord) : () => setWordToTeach(selectedWord)}
            >
            {wordToTeach.length ? "Add" : "Learn"}
            </button>
            <button
            onClick={() => submit()}
            disabled={addSentenceState.fetching || (wordToTeach.length && !sentenceWords.length)}
            >
            Submit
            </button>
            </div>
            ): (
            <div> 
              <button
              onClick={null}
              >
              Start next episode
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