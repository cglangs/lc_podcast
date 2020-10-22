import React, { Component } from 'react'
import gql from 'graphql-tag';
import { Mutation, Query} from 'react-apollo';
import '../styles/App.css';
import {punctuations, colors} from '../constants.js'
import Switch from "./Switch";
import Select from "react-select";


export const GET_LEVEL_WORDS = gql`
  query GetLevelWords{
  Author{
    level{
      level_number
      points
      minimum_usage
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
        times_used
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
  mutation addsentence($rawSentenceTextSimplified: String!, $cleanSentenceTextSimplified: String!, $displaySentenceTextSimplified: String!,$rawSentenceTextTraditional: String!, $cleanSentenceTextTraditional: String!, $displaySentenceTextTraditional: String!, $pinyin: String!, $english: String!, $italics: String!, $wordToTeachId: Int!, $sentenceContainedWordListSimplified: [String!], $currentInterval: Int!, $shouldCall: Boolean!) {
    CreateSentence(raw_text: $rawSentenceTextSimplified, clean_text: $cleanSentenceTextSimplified, display_text: $displaySentenceTextSimplified, alt_raw_text: $rawSentenceTextTraditional, alt_clean_text: $cleanSentenceTextTraditional, alt_display_text: $displaySentenceTextTraditional, pinyin: $pinyin, english: $english, italics: $italics) {
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
  mutation replacesentence($rawSentenceTextSimplified: String!, $cleanSentenceTextSimplified: String!, $displaySentenceTextSimplified: String!,$rawSentenceTextTraditional: String!, $cleanSentenceTextTraditional: String!, $displaySentenceTextTraditional: String!, $pinyin: String!, $english: String!, $italics: String! $wordToTeachId: Int!, $sentenceContainedWordListSimplified: [String!], $currentInterval: Int!, $formerSentenceRawText: String!) {
    CreateSentence(raw_text: $rawSentenceTextSimplified, clean_text: $cleanSentenceTextSimplified, display_text: $displaySentenceTextSimplified, alt_raw_text: $rawSentenceTextTraditional, alt_clean_text: $cleanSentenceTextTraditional, alt_display_text: $displaySentenceTextTraditional, pinyin: $pinyin, english: $english,, italics: $italics) {
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
    TransferUserProgress(src_sentence: $formerSentenceRawText, dest_sentence: $rawSentenceTextSimplified){
      raw_text
    }
    DeleteSentence(raw_text: $formerSentenceRawText){
      raw_text
    }
  }

`
const customStyles = {

  option: (styles, { data}) => {
    return {
      ...styles,
      color: "black",
      backgroundColor: data.color
    }
  }

}

class Author extends Component {
  constructor(props){
    super(props)
    this.baseState = {
        SentenceElements: [],
        formerSentenceRawText: null,
        formerSentenceCleanText: null,
        selectedWordId: null,
        wordToTeach: {text: '', word_id: null},
        containsWordToTeach: 0,
        points: 0,
        punctuationMode: false,
        selectedPunctuationId: null,
        pinyin: '',
        english: '',
        italics: '',
        replaceMode: false,
        interval: null
      }
    if(typeof props.location.state === 'undefined'){
      this.state = this.baseState
    } else {
        this.state = {
          SentenceElements: props.location.state.sentenceElements,
          formerSentenceRawText: props.location.state.formerSentenceRawText,
          formerSentenceCleanText: props.location.state.formerSentenceCleanText,
          selectedWordId: null,
          wordToTeach: props.location.state.wordToTeach,
          containsWordToTeach: props.location.state.containsWordToTeach,
          points: props.location.state.points,
          punctuationMode: false,
          selectedPunctuationId: null,
          pinyin: props.location.state.pinyin,
          english: props.location.state.english,
          italics: props.location.state.italics,
          interval: props.location.state.interval,
          replaceMode: true
        }
      }
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

    if(clean_sentences.includes(cleanSentenceTextSimplified) && cleanSentenceTextSimplified !== this.state.formerSentenceCleanText){
      alert("Already used this sentence. Please change it.")
    }
    else{
        addSentence({ variables: this.getSentenceVariables(SentenceElements, sentenceWords,sentenceWordListSimplified,cleanSentenceTextSimplified, interval_order, words_left)})
    }
  }

  getSentenceVariables(SentenceElements, sentenceWords, sentenceWordListSimplified,cleanSentenceTextSimplified, interval_order, words_left) {
    const { wordToTeach, pinyin, english, italics, formerSentenceRawText, replaceMode} = this.state

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

    var resultObj ={rawSentenceTextSimplified,cleanSentenceTextSimplified, displaySentenceTextSimplified,rawSentenceTextTraditional,cleanSentenceTextTraditional, displaySentenceTextTraditional, pinyin, english, italics, wordToTeachText,wordToTeachId,sentenceContainedWordListSimplified,currentInterval}

    if(replaceMode){
      Object.assign(resultObj,{formerSentenceRawText})
    } else{
      Object.assign(resultObj,{shouldCall})
    }

    return resultObj
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

  getColor(word, minimum_usage){
    var color = 'white'
    const max_usage = minimum_usage + 5
    if(word.hasOwnProperty('times_used')){
      color = colors.find((colorType) => colorType.times_used + minimum_usage === parseInt(word.times_used) || (colorType.times_used === 5 && parseInt(word.times_used) >= max_usage)).color
    }
    return color
  }

  render() {
    const { SentenceElements, wordToTeach, points, selectedWordId, containsWordToTeach, punctuationMode,selectedPunctuationId} = this.state

    return (
      <div className="App">
        <header className="App-header">
          <Query query={GET_LEVEL_WORDS}>
          {({ loading, error, data, refetch }) => {
              if (loading) return <div>Fetching</div>
              if (error) return <div>Error</div>
              const interval = this.state.interval || data.Author[0].interval
              const wordArray = this.get_word_array(data.Author[0].level, interval.interval_order)
              const minimum_usage = parseInt(data.Author[0].level.minimum_usage)
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
                <Switch isDisabled={false} isOn={punctuationMode} handleToggle={() => 
                  this.setState(prevState => ({punctuationMode: !prevState.punctuationMode}))} />
                  {punctuationMode ?
                    (
                      <div>
                    <Select
                    styles={customStyles}
                    value={{value: selectedPunctuationId, label: selectedPunctuationId && punctuations.find(mark=> mark.id === selectedPunctuationId).text}}
                    options={punctuations.map(mark =>  { return { label: mark.text, value: mark.id}})}
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
                    options={wordArray.map(word =>  { return { label: word.text, value: word.word_id, color: this.getColor(word,minimum_usage)}})}
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
                  <div>
                    <input
                      value={this.state.italics}
                      onChange={e => this.setState({ italics: e.target.value })}
                      type="italics"
                      placeholder="Enter sentence's extra notes"
                      style={{width: "250px"}}
                    />
                  </div>
                   <Mutation mutation={this.state.replaceMode ? REPLACE_SENTENCE : ADD_SENTENCE}
                      update={(store) => {
                        this.setState(this.baseState)
                        refetch()                      
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
                            disabled={!containsWordToTeach/* || points <  interval.min_length || points >  interval.max_length*/}
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
