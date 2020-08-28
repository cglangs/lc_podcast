import React, { Component } from 'react'
import gql from 'graphql-tag';
import { Mutation, Query} from 'react-apollo';
import '../styles/App.css';
import {punctuations} from '../constants.js'
import Switch from "./Switch";
import Select from "react-select";


export const GET_LEVEL_WORDS = gql`
  query GetLevelWords{
  Author{
    level{
      level_number
      points
      teachable_words{
        text
        alt_text
        word_id
        level{
          points
        }
      }
      addable_words{
        text
        alt_text
        word_id
        level{
          points
        }
      }
    }
    interval{
      sentences{
        clean_text
      }
      interval_order
      seconds
      min_length
      max_length
    }
  }
}
`

const ADD_SENTENCE = gql`
  mutation addsentence($rawSentenceTextSimplified: String!, $cleanSentenceTextSimplified: String!, $displaySentenceTextSimplified: String!,$rawSentenceTextTraditional: String!, $cleanSentenceTextTraditional: String!, $displaySentenceTextTraditional: String!, $pinyin: String!, $english: String!, $wordToTeachText: String!, $wordToTeachId: Int!, $sentenceContainedWordListSimplified: [String!], $currentInterval: Int!, $shouldCall: Boolean!, $formerSentenceRawTextSimplified: String!) {
    CreateSentence(raw_text: $rawSentenceTextSimplified, clean_text: $cleanSentenceTextSimplified, display_text: $displaySentenceTextSimplified, alt_raw_text: $rawSentenceTextTraditional, alt_clean_text: $cleanSentenceTextTraditional, alt_display_text: $displaySentenceTextTraditional, pinyin: $pinyin, english: $english) {
      raw_text
    }
    AddSentenceLevel(from: {raw_text:  $rawSentenceTextSimplified} to: {level_number: 1}){
      from {raw_text}
      to {level_number}
    }
    AddSentenceWord_taught(from: {raw_text: $rawSentenceTextSimplified} to: {word_id: $wordToTeachId}){
      from {raw_text}
      to {text}
    }
    AddSentenceInterval(from: {raw_text: $rawSentenceTextSimplified} to: {interval_order: $currentInterval}){
      from {raw_text}
      to {interval_order}
    }
    AddSentenceDependencies(src_sentence: $rawSentenceTextSimplified, dest_words: $sentenceContainedWordListSimplified){
      raw_text
      display_text
    }
    IncrementInterval(should_call: $shouldCall)
  }

`

const REPLACE_SENTENCE = gql`
  mutation replacesentence($rawSentenceTextSimplified: String!, $cleanSentenceTextSimplified: String!, $displaySentenceTextSimplified: String!,$rawSentenceTextTraditional: String!, $cleanSentenceTextTraditional: String!, $displaySentenceTextTraditional: String!, $pinyin: String!, $english: String!, $wordToTeachText: String!, $wordToTeachId: Int!, $sentenceContainedWordListSimplified: [String!], $currentInterval: Int!, $shouldCall: Boolean!, $formerSentenceRawTextSimplified: String!) {
    DeleteSentence(raw_text: $formerSentenceRawTextSimplified){
      raw_text
    }
    CreateSentence(raw_text: $rawSentenceTextSimplified, clean_text: $cleanSentenceTextSimplified, display_text: $displaySentenceTextSimplified, alt_raw_text: $rawSentenceTextTraditional, alt_clean_text: $cleanSentenceTextTraditional, alt_display_text: $displaySentenceTextTraditional, pinyin: $pinyin, english: $english) {
      raw_text
    }
    AddSentenceLevel(from: {raw_text:  $rawSentenceTextSimplified} to: {level_number: 1}){
      from {raw_text}
      to {level_number}
    }
    AddSentenceWord_taught(from: {raw_text: $rawSentenceTextSimplified} to: {word_id: $wordToTeachId}){
      from {raw_text}
      to {text}
    }
    AddSentenceInterval(from: {raw_text: $rawSentenceTextSimplified} to: {interval_order: $currentInterval}){
      from {raw_text}
      to {interval_order}
    }
    AddSentenceDependencies(src_sentence: $rawSentenceTextSimplified, dest_words: $sentenceContainedWordListSimplified, word_to_teach: $wordToTeachText){
      raw_text
      display_text
    }
  }

`
const customStyles = {

  option: (styles, { data}) => {
    return {
      ...styles,
      color: "black"
    }
  }

}

class Author extends Component {
  constructor(props){
    super(props)
    if(typeof props.location.state === 'undefined'){
      this.state = {
        SentenceElements: [],
        formerSentenceRawText: null,
        selectedWordId: null,
        wordToTeach: {text: '', word_id: null},
        containsWordToTeach: 0,
        points: 0,
        punctuationMode: false,
        selectedPunctuationId: null,
        pinyin: '',
        english: '',
        replaceMode: false,
        interval: null
      }
    } else {
        this.state = {
          SentenceElements: props.location.state.sentenceElements,
          formerSentenceRawText: props.location.state.formerSentenceRawText,
          selectedWordId: null,
          wordToTeach: props.location.state.wordToTeach,
          containsWordToTeach: props.location.state.containsWordToTeach,
          points: props.location.state.points,
          punctuationMode: false,
          selectedPunctuationId: null,
          pinyin: props.location.state.pinyin,
          english: props.location.state.english,
          interval: props.location.state.interval,
          replaceMode: true
        }
      }
    this.baseState = this.state 
  }

  get_word_array(level, interval_order) {
    let arr = []
    const wordToTeach = this.state.wordToTeach
    if(wordToTeach && wordToTeach.text.length && interval_order === 1){
        arr = [wordToTeach, ...level.addable_words]
      } else if (wordToTeach && wordToTeach.text.length && interval_order > 1){
          arr = level.addable_words
      } else{
        arr = level.teachable_words
      }
    return arr
  }


  submitSentenceData(clean_sentences, interval_order, words_left, addSentence){
    const SentenceElements = this.state.SentenceElements
    const sentenceWords = SentenceElements.filter( element => element.hasOwnProperty('word_id') )
    const sentenceWordListSimplified = sentenceWords.map(word => word.text)
    const cleanSentenceTextSimplified = sentenceWordListSimplified.join('')

    if(clean_sentences.includes(cleanSentenceTextSimplified)){
      alert("Already used this sentence. Please change it.")

    }
    else{
        addSentence({ variables: this.getSentenceVariables(SentenceElements, sentenceWords,sentenceWordListSimplified,cleanSentenceTextSimplified, interval_order, words_left)})
    }
  }

  getSentenceVariables(SentenceElements, sentenceWords, sentenceWordListSimplified,cleanSentenceTextSimplified, interval_order, words_left) {
    const { wordToTeach, pinyin, english, formerSentenceRawText} = this.state

    const sentenceContainedWordListSimplified = sentenceWordListSimplified.filter(word => word !== wordToTeach.text)
    const SentenceElementListSimplified = SentenceElements.map(element => element.text)
    const rawSentenceTextSimplified = SentenceElementListSimplified.join('')
    const displaySentenceTextSimplified = rawSentenceTextSimplified.replace(new RegExp(wordToTeach.text, 'g'), '#')

    const sentenceWordListTraditional = sentenceWords.map(word => word.alt_text)
    const cleanSentenceTextTraditional = sentenceWordListTraditional.join('')
    const SentenceElementListTraditional = SentenceElements.map(element => element.alt_text || element.text)
    const rawSentenceTextTraditional = SentenceElementListTraditional.join('')
    const displaySentenceTextTraditional = rawSentenceTextTraditional.replace(new RegExp(wordToTeach.alt_text, 'g'), '#')

    const wordToTeachText = wordToTeach.text
    const wordToTeachId = wordToTeach.word_id
    const currentInterval = interval_order
    const shouldCall =  words_left === 1 && currentInterval < 5

    return{rawSentenceTextSimplified,cleanSentenceTextSimplified, displaySentenceTextSimplified,rawSentenceTextTraditional,cleanSentenceTextTraditional, displaySentenceTextTraditional, pinyin, english, wordToTeachText,wordToTeachId,sentenceContainedWordListSimplified,currentInterval,shouldCall,formerSentenceRawText}
  }

  appendElement(newElement) {
    if(!newElement.hasOwnProperty('word_id')){
      this.setState(prevState => 
      ({
        SentenceElements: [...prevState.SentenceElements, newElement]
      })) 
    } else {
      this.setState(prevState => 
        ({
          points: prevState.points + newElement.level.points, 
          containsWordToTeach: newElement.word_id === this.state.wordToTeach.word_id ? prevState.containsWordToTeach + 1 : prevState.containsWordToTeach,
          SentenceElements: [...prevState.SentenceElements, newElement]
        }))
    }
  }

  popElement() {
    if(!this.state.SentenceElements[this.state.SentenceElements.length - 1].hasOwnProperty('word_id')){
     this.setState(prevState => 
      ({
        SentenceElements: prevState.SentenceElements.slice(0,-1)
      }))     
    } else {
    this.setState(prevState => 
      ({
        points: prevState.points - prevState.SentenceElements[prevState.SentenceElements.length - 1].level.points, 
        containsWordToTeach: prevState.SentenceElements[prevState.SentenceElements.length - 1].word_id === this.state.wordToTeach.word_id ? prevState.containsWordToTeach - 1 : prevState.containsWordToTeach,
        SentenceElements: prevState.SentenceElements.slice(0,-1)
      }))
    }
  }

  updateStoreAfterAddSentence(store, refetch){
    const data = store.readQuery({ query: GET_LEVEL_WORDS })
    if(data.Author[0].level.teachable_words.length > 1){
      if(/*this.state.interval.interval_order === 1 ||*/ data.Author[0].interval.interval_order === 1){
            data.Author[0].level.addable_words.push(this.state.wordToTeach)
      }
      data.Author[0].level.teachable_words = data.Author[0].level.teachable_words.filter((word=> word.word_id !== this.state.wordToTeach.word_id))
      data.Author[0].interval.sentences.push({__typename: "Sentence", clean_text: this.state.SentenceElements.filter(element => element.hasOwnProperty('word_id')).map(word => word.text).join('')})
      console.log(data.Author[0].interval.sentences)
      store.writeQuery({ query: GET_LEVEL_WORDS, data })
    } else {
      refetch()
    }
  }


  render() {
    const { SentenceElements, wordToTeach, points, selectedWordId, containsWordToTeach, punctuationMode,selectedPunctuationId} = this.state
    console.log(this.state)
    return (
      <div className="App">
        <header className="App-header">
          <Query query={GET_LEVEL_WORDS}>
          {({ loading, error, data, refetch }) => {
              if (loading) return <div>Fetching</div>
              if (error) return <div>Error</div>
              const interval = this.state.interval || data.Author[0].interval
              const wordArray = this.get_word_array(data.Author[0].level, interval.interval_order)

               return (
                <div>
                <div className="Author-dashboard">
                  <p>{"Interval: " + interval.interval_order}</p>
                  <p>{"Minimum points: " + interval.min_length}</p>
                  <p>{"Maximum points:: " + interval.max_length}</p>
                  <p>{"Current Points: " + points}</p>
                </div>
                <p>Word being learned: {wordToTeach.text}</p>
                <div>
                <p style={{fontSize: "30px"}}>{SentenceElements.length ?  SentenceElements.map(word => word.text).join('') : null}</p>
               <button
                onClick={this.popElement.bind(this)}
                hidden={SentenceElements.length === 0}
                >
                Backspace
                </button>
                </div>
                <Switch isOn={punctuationMode} handleToggle={() => 
                  this.setState(prevState => ({punctuationMode: !prevState.punctuationMode}))} />
                  {punctuationMode ?
                    (
                      <div>
                    <Select
                    styles={customStyles}
                    value={{value: selectedPunctuationId, label: selectedPunctuationId && punctuations.find(mark=> mark.id === selectedPunctuationId).text}}
                    options={punctuations.map(mark =>  { return { label: mark.text, value: mark.id }})}
                    onChange={option => this.setState({selectedPunctuationId: parseInt(option.value)})}>
                    </Select>    
                   <button onClick={() => this.appendElement(punctuations.find(mark=> mark.id === selectedPunctuationId))}>
                    Add
                    </button>
                    </div>
                  ) : (
                    <div>
                  <Select
                    styles={customStyles}
                    value={{value: selectedWordId, label: selectedWordId && wordArray.find(word=> word.word_id === selectedWordId).text}}
                    options={wordArray.map(word =>  { return { label: word.text, value: word.word_id }})}
                    onChange={option => this.setState({selectedWordId: parseInt(option.value)})}>
                    </Select>                    
                     <button
                      onClick={wordToTeach.text.length ? () => this.appendElement(wordArray.find(word=> word.word_id === selectedWordId)) : 
                        () => {this.setState({wordToTeach: wordArray.find(word=> word.word_id === selectedWordId)})}}
                      >
                      {wordToTeach.text.length ? "Add" : "Learn"}
                      </button>
                    </div>
                    )
                }
                  <div>
                    <input
                      value={this.state.pinyin}
                      onChange={e => this.setState({ pinyin: e.target.value })}
                      type="pinyin"
                      placeholder="Enter sentence's pinyin"
                      style={{width: "250px"}}
                    />
                  </div>
                  <div>
                    <input
                      value={this.state.english}
                      onChange={e => this.setState({ english: e.target.value })}
                      type="english"
                      placeholder="Enter sentence's english translation"
                      style={{width: "250px"}}
                    />
                  </div>
                   <Mutation mutation={this.state.replaceMode ? REPLACE_SENTENCE : ADD_SENTENCE}
                      update={(store) => {
                        this.updateStoreAfterAddSentence(store, refetch)
                        this.setState(this.baseState)                        
                        }
                      }
                   >
                        {addSentence => (
                          <button
                            onClick={() => 
                              {
                                this.submitSentenceData(interval.sentences.map((sentence) => sentence.clean_text), interval.interval_order,data.Author[0].level.teachable_words.length, addSentence)
                              }
                          }
                            disabled={!containsWordToTeach || points <  interval.min_length || points >  interval.max_length}
                          >
                          Submit
                          </button>
                        )}
                    </Mutation>
                    <div>
                    <button onClick={() => this.setState(this.baseState) }>
                    Clear Sentence
                    </button>
                    </div>
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
