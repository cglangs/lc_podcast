import React from 'react';
import gql from 'graphql-tag';
import { useQuery } from 'urql'
import '../styles/App.css';


const GET_WORDS = gql`
  query GetWords{
      wordlist{
          text
      }
  }
`

function App() {

  const [sentenceWords, setSentenceWords] = React.useState([])
  const [selectedWord, setSelectedWord] = React.useState('')
  const [wordToTeach, setWordToTeach] = React.useState('')

  const [result] = useQuery({ query: GET_WORDS })
  const {data} = result
  const appendWord = (newWord) => setSentenceWords(words => [...words, newWord])
  const popWord = () => setSentenceWords(words => words.slice(0,-1))

  return (
    <div className="App">
      <header className="App-header">
          <p style={{fontSize: "50px;"}}>{"Word being learned: " + wordToTeach}</p>
          <div>
          <p style={{fontSize: "30px;"}}>{sentenceWords.length ?  sentenceWords.join(''): null}</p>
           <button
            disabled={sentenceWords.length === 0}
            onClick={popWord}
            >
            Backspace
            </button>
          </div>
          <select onChange={e => setSelectedWord(e.target.value)}>
            <option selected>Select Word</option>
            {data ? data.wordlist.map(word => <option value={word.text}>{word.text}</option>) : null}
            </select>
           <button
            onClick={wordToTeach.length ? () => appendWord(selectedWord) : () => setWordToTeach(selectedWord)}
            >
            {wordToTeach.length ? "Add" : "Learn"}
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
