import React, { Component } from 'react'
import {Query} from 'react-apollo';
import gql from 'graphql-tag';

const GET_DROPDOWNS = gql`
  query getDropdowns($userName: String!) {
	getIntervalsAndLevels(userName: $userName) {
		levels
		intervals
	}
  }
`

const GET_SENTENCE_LIST = gql`
  query getSentences($levelNumber: Int! $intervalOrder: Int!) {
	getSentenceList(levelNumber: $levelNumber intervalOrder: $intervalOrder) {
		raw_text
		clean_text
		words_contained{
			contains_order
			Word{
				word_id
				text
				alt_text
				level{
					points
				}
			}
		}
		display_text
		word_taught{
			word_id
			text
			alt_text
			level{
				points
			}
		}
		pinyin
		english
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


class Editor extends Component {
	state = {
      selectedLevel: 1,
      selectedInterval: 1
    }


  getDropdowns(refetch){
  	return (
		<Query query={GET_DROPDOWNS} variables={{userName: "test"}}>
      	{({ loading, error, data, refetch }) => {
      	  if (loading) return <div>Fetching</div>
          if (error) return <div>Error</div>
          return(
          	<div>
          	Level: <select onChange={(e) => this.setState({selectedLevel: parseInt(e.target.value)})}>{data.getIntervalsAndLevels.levels.map((level) => <option value={level} selected={level === this.state.selectedLevel}>{level}</option>)}</select>
          	Interval: <select onChange={(e) => this.setState({selectedInterval: parseInt(e.target.value)})}>{data.getIntervalsAndLevels.intervals.map((interval) => <option value={interval} selected={interval === this.state.selectedInterval}>{interval}</option>)}</select>
          	</div>
          )
      	}
      }
		</Query>
  	)

  }

  parseSentence(sentence){
  	let current_index = 0
  	let sentenceElements = []
  	let wordToTeach = null
  	let containsWordToTeach = 0
  	let points = 0
  	let display_text_copy = sentence.display_text
  	console.log(sentence)
  	sentence.words_contained.sort((previous, next)=> {return previous.contains_order - next.contains_order})
  	while(display_text_copy.length){
  		if(display_text_copy[0] === '#'){
  			sentenceElements.push({text: sentence.word_taught.text, alt_text: sentence.word_taught.alt_text, word_id: sentence.word_taught.word_id, level: {points: sentence.word_taught.level.points}})
  			if(wordToTeach === null){
  				wordToTeach = {text: sentence.word_taught.text, alt_text: sentence.word_taught.alt_text, word_id: sentence.word_taught.word_id, level: {points: sentence.word_taught.level.points}}
  			}
  			display_text_copy = display_text_copy.substring(1)
  			containsWordToTeach++
  			points += sentence.word_taught.level.points
  		} else if(sentence.words_contained[current_index] && sentence.words_contained[current_index].Word.text[0] === display_text_copy[0]){
  			console.log(sentence)
  			sentenceElements.push({ text: sentence.words_contained[current_index].Word.text, alt_text: sentence.words_contained[current_index].Word.alt_text, word_id: sentence.words_contained[current_index].Word.word_id, level: {points: sentence.words_contained[current_index].Word.level.points}})
  			display_text_copy = display_text_copy.substring(sentence.words_contained[current_index].Word.text.length)
  			points += sentence.words_contained[current_index].Word.level.points
  			current_index++
  		} else {
  			 sentenceElements.push({text: display_text_copy[0]})
  			 display_text_copy = display_text_copy.substring(1)
  		}
  	}

	this.props.history.push({
		pathname: '/author',
		state: {
			sentenceElements: sentenceElements, 
			formerSentenceRawText: sentence.raw_text,
			formerSentenceCleanText: sentence.clean_text,
			wordToTeach: wordToTeach,
			containsWordToTeach: containsWordToTeach,
			pinyin: sentence.pinyin,
			english: sentence.english,
			points: points,
			interval: sentence.interval
		}  
	})						
  }

	render(){
		return(
	    <div className="App">
	      <header className="App-header">
		      <Query query={GET_SENTENCE_LIST} variables={{levelNumber: this.state.selectedLevel, intervalOrder: this.state.selectedInterval}}>
		      	{({ loading, error, data, refetch }) => {
		      	  if (loading) return <div>Fetching</div>
	              if (error) return <div>Error</div>
	              return(
	              	<div>
	              		{this.getDropdowns()}
	              		<table>
	              		  <thead>
						    <tr>
						      <th>Sentence</th>
						      <th>Word Taught</th>
						      <th>Pinyin</th>
						      <th>Translation</th>
						    </tr>
						  </thead>
	              		<tbody>
	              		{data.getSentenceList.map(sentence => {
	              			return(
		              			<tr>
		              			 <td>{sentence.raw_text}</td>
		              			 <td>{sentence.word_taught.text}</td>
		              			 <td>{sentence.pinyin}</td>
		              			 <td>{sentence.english}</td>
		              			 <td><button onClick={() => this.parseSentence(sentence)}>Edit</button></td>
		              			</tr>
		              		)
	              		})}
	              		</tbody>
	              		</table>
	              	</div>
	              )
	          	}
	          }
				</Query>
			</header>
		</div>
		)
	}



}

export default Editor;