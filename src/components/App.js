import React from 'react';
import gql from 'graphql-tag';
import { useMutation } from 'urql';
import '../styles/App.css';

const POST_MUTATION = gql`
  mutation PostMutation($wordText: String!) {
    CreateWord(text: $wordText) {
      text
    }
  }

`

function App() {

  const [wordText, setWordText] = React.useState('')
  
  const [state, executeMutation] = useMutation(POST_MUTATION)
  
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
        disabled={state.fetching}
        onClick={submit}
      >
        Submit
      </button>

      </header>
    </div>
  );
}

export default App;
