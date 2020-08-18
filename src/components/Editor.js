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
		word_taught{
			text
		}
		pinyin
		english
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
      		console.log(data)
      	  if (loading) return <div>Fetching</div>
          if (error) return <div>Error</div>
          return(
          	<div>
          	Levels: <select onChange={(e) => this.setState({selectedLevel: parseInt(e.target.value)})}>{data.getIntervalsAndLevels.levels.map((level) => <option value={level} selected={level === this.state.selectedLevel}>{level}</option>)}</select>
          	Intervals: <select onChange={(e) => this.setState({selectedInterval: parseInt(e.target.value)})}>{data.getIntervalsAndLevels.intervals.map((interval) => <option value={interval} selected={interval === this.state.selectedInterval}>{interval}</option>)}</select>
          	</div>
          )
      	}
      }
		</Query>
  	)

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