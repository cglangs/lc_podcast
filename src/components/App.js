import React from 'react';
import gql from 'graphql-tag';
import { useQuery } from 'urql'
import { useMutation } from 'urql';
import '../styles/App.css';

const ADD_WORD = gql`
  mutation AddWord($wordText: String!) {
    CreateWord(text: $wordText) {
      text
    }
  }
`
const GET_WORDS = gql`
  query GetWords{
      wordlist{
          text
      }
  }
`

const WordList = () => {

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


}

function App() {

  const [wordText, setWordText] = React.useState('')
  


  
  const [addWordState, executeMutation] = useMutation(ADD_WORD)

  const submit = React.useCallback(() => {
    executeMutation({wordText})
  }, [executeMutation, wordText])



  return (
    <div className="App">
      <header className="App-header">
         <input
          className="mb2"
          value={wordText}
          onChange={e => setWordText(e.target.value)}
          type="text"
          placeholder="Enter word here"
        />
      <button
        disabled={addWordState.fetching}
        onClick={submit}
      >
        Add Word
      </button>

      {WordList()}
      </header>
    </div>
  );
}

export default App;
