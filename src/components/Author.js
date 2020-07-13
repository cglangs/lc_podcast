import React, { Component } from 'react'
import gql from 'graphql-tag';
import { Mutation, Query} from 'react-apollo';
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
  constructor(){
    super()
    this.state = {
      sentenceWords: [],
      selectedWordId: null,
      wordToTeach: {text: ''},
      shouldCall: false,
      containsWordToTeach: false,
      points: 0
    }
    this.baseState = this.state 
  }

  get_word_array(level) {
    let arr = []
    const wordToTeach = this.state.wordToTeach
    if(wordToTeach && wordToTeach.text.length){
        arr = [wordToTeach, ...level.addable_words]
      } else{
        arr = level.teachable_words
      }
    return arr
  }


  getSentenceVariables(interval_order) {
    const {sentenceWords, wordToTeach, shouldCall} = this.state
    const sentenceWordList = sentenceWords.map(word => word.text)
    const rawSentenceText = sentenceWordList.join('')
    const displaySentenceText = rawSentenceText.replace(wordToTeach.text,"#")
    const wordToTeachText = wordToTeach.text
    const wordToTeachId = wordToTeach.word_id
    const currentInterval = interval_order
    return{rawSentenceText,displaySentenceText,wordToTeachText,wordToTeachId,sentenceWordList,currentInterval,shouldCall}
  }

  appendWord(newWord) {
    this.setState(prevState => 
      ({points: prevState.points + newWord.level.points, sentenceWords: [...prevState.sentenceWords,newWord], 
        containsWordToTeach: newWord.word_id === this.state.wordToTeach.word_id ? true : prevState.containsWordToTeach}));
  }

  popWord() {
    this.setState(prevState => 
      ({
        points: prevState.points - prevState.sentenceWords[prevState.sentenceWords.length - 1], 
        sentenceWords: prevState.sentenceWords.slice(0,-1)
      }))
  }

  updateStoreAfterAddSentence(store, wordToTeach){
    const data = store.readQuery({ query: GET_LEVEL_WORDS })
    if(data.Author[0].interval.interval_order === 1){
          data.Author[0].level.addable_words.push(wordToTeach)
        }
    console.log(data.Author[0].level.teachable_words)
    data.Author[0].level.teachable_words = data.Author[0].level.teachable_words
      .filter((word=> word.word_id !== wordToTeach.word_id))
    console.log(data.Author[0].level.teachable_words)
    store.writeQuery({ query: GET_LEVEL_WORDS, data })

  }


  render() {
    const { sentenceWords, wordToTeach, points, selectedWordId, containsWordToTeach} = this.state
    console.log(this.state)

    return (
      <div className="App">
        <header className="App-header">
          <Query query={GET_LEVEL_WORDS}>
          {({ loading, error, data }) => {
              if (loading) return <div>Fetching</div>
              if (error) return <div>Error</div>
              const wordArray = this.get_word_array(data.Author[0].level)
               return (
                <div>
                <p style={{fontSize: "50px;"}}>{"Current Points: " + points}</p>
                <p style={{fontSize: "50px;"}}>Word being learned: {wordToTeach.text.length && wordToTeach.text}</p>
                <div>
                <p style={{fontSize: "30px;"}}>{sentenceWords.length ?  sentenceWords.map(word => word.text).join('') : null}</p>
                 <button
                  disabled={sentenceWords.length === 0}
                  onClick={this.popWord.bind(this)}
                  >
                  Backspace
                  </button>
                </div>
                <select onChange={e => this.setState({selectedWordId: parseInt(e.target.value)})} value={selectedWordId}>
                  <option selected value=''>Select Word</option>
                  {wordArray.map(word => <option value={word.word_id}>{word.text}</option>)}
                  </select>
                 <button
                  onClick={wordToTeach.text.length ? () => this.appendWord(wordArray.find(word=> word.word_id === selectedWordId)) : 
                    () => this.setState({wordToTeach: wordArray.find(word=> word.word_id === selectedWordId)})}
                  >
                  {wordToTeach.text.length ? "Add" : "Learn"}
                  </button>
                   <Mutation mutation={ADD_SENTENCE}
                      update={(store) => {
                        this.updateStoreAfterAddSentence(store, wordToTeach)
                        this.setState(this.baseState)                        
                      }
                      }

                   >
                        {addSentence => (
                          <button
                            onClick={() => 
                              {
                                addSentence({ variables: this.getSentenceVariables(data.Author[0].interval.interval_order) })

                              }
                          }
                            disabled={(wordToTeach.text.length && !sentenceWords.length) || !containsWordToTeach }
                          >
                          Submit
                          </button>
                        )}
                    </Mutation>
                  </div>
                  )
                }}
            </Query>
        </header>
        
      </div>
    
    );
  }
}

export default Author;
