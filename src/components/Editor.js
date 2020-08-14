import React, { Component } from 'react'
import {Query} from 'react-apollo';
import gql from 'graphql-tag';



const GET_SENTENCE_LIST = gql`
  query getSentences($levelNumber: Int! $intervalOrder: Int!) {
	getSentenceList(levelNumber: $levelNumber intervalOrder: $intervalOrder) {
		raw_text
	}

  }

`


class Editor extends Component {


	render(){
		return(
	    <div className="App">
	      <header className="App-header">
		      <Query query={GET_SENTENCE_LIST} variables={{levelNumber: 1, intervalOrder: 1}}>
		      	{({ loading, error, data, refetch }) => {
		      	  if (loading) return <div>Fetching</div>
	              if (error) return <div>Error</div>
	              return(
	              	<div>
	              		<table>
	              		<tbody>
	              		{data.getSentenceList.map(sentence => {
	              			return(
		              			<tr>
		              			 <td>{sentence.raw_text}</td>
		              			</tr>
		              		)
	              		})

	              		}
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