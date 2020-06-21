import React from 'react';
import gql from 'graphql-tag';
import { useQuery } from 'urql'
import { useMutation } from 'urql'
import '../styles/App.css';


const GET_WORDS = gql`
  query GetWords{
      Episode(episode_number: 1){
        episode_number
        teachable_words{
          text
        }
        addable_words{
          text
        }
      }
  }
`

const ADD_SENTENCE = gql`
  mutation AddSentence($rawSentenceText: String!, $displaySentenceText: String!, $wordToLearnText: String!, $sentenceWordList: [String!]) {
    CreateSentence(raw_text: $rawSentenceText, display_text: $displaySentenceText) {
      text
    }
    AddSentenceEpisode(from: {raw_text:  $rawSentenceText} to: {episode_number: 1}){
      from {text}
      to {episode_number}
    }
    AddSentenceTime_interval(from: {raw_text: $rawSentenceText} to: {interval_order: 1}){
      from {text}
      to {interval_order}
    }
    AddSentenceWord_taught(from: {raw_text: $rawSentenceText} to: {text: $wordToLearnText}){
      from {text}
      to {text}
    }
    AddSentenceDependencies(src_sentence: $rawSentenceText, dest_words: $sentenceWordList)
  }

`
//Create relation between sentence and word
//Create relation between sentence and episode

function displayWordDropDown(episode, wordToTeachSelected){
  let arr = []
  if(episode){
    if(wordToTeachSelected){
      arr = episode.addable_words
    } else{
      arr = episode.teachable_words
    }
  }
  return arr
}

function App() {

  const [sentenceWords, setSentenceWords] = React.useState([])
  const [selectedWord, setSelectedWord] = React.useState('')
  const [wordToTeach, setWordToTeach] = React.useState('')


  const [addSentenceState, executeMutation] = useMutation(ADD_SENTENCE)

  const submit = React.useCallback(() => {
    const rawSentenceText = sentenceWords.join('')
    const displaySentenceText = rawSentenceText.replace(wordToTeach,"#")
    const sentenceWordList = sentenceWords

    executeMutation({rawSentenceText, displaySentenceText, wordToTeach, sentenceWordList})
  }, [executeMutation, sentenceWords, wordToTeach])

  const [result] = useQuery({ query: GET_WORDS })
  const {data} = result

  const appendWord = (newWord) => setSentenceWords(words => [...words, newWord])
  const popWord = () => setSentenceWords(words => words.slice(0,-1))

  return (
    <div className="App">
      <header className="App-header">
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
          <select onChange={e => setSelectedWord(e.target.value)}>
            <option selected>Select Word</option>
            {data && displayWordDropDown(data.Episode[0],wordToTeach.length).map(word => <option value={word.text}>{word.text}</option>)}
            </select>
           <button
            onClick={wordToTeach.length ? () => appendWord(selectedWord) : () => setWordToTeach(selectedWord)}
            >
            {wordToTeach.length ? "Add" : "Learn"}
            </button>
            <button
            onClick={() => submit()}
            disabled={addSentenceState.fetching}
            >
            Submit
            </button>
      </header>
    </div>
  );
}

export default App;

















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
