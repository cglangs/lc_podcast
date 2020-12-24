import React, { Component } from 'react'
import {Query} from 'react-apollo';
import gql from 'graphql-tag';

const GET_WORDS = gql`
  query getWords {
	Level {
		all_words{
			word_id
			text
			pinyin
			english
			italics
			times_used
			level{
				level_number
			}
		}
	}
  }
`

class Words extends Component {

	editWord(word){
		this.props.history.push({
			pathname: '/wordedit',
			state: {
				word_id: word.word_id,
				text: word.text,
				pinyin: word.pinyin,
				english: word.english,
				italics: word.italics
			}  
		})
	}
	render(){
	  return (
	    <div className="App">
	      <header className="App-header">
		      <Query query={GET_WORDS}>
		      	{({ loading, error, data, refetch }) => {
		      	  if (loading) return <div>Fetching</div>
	              if (error) return <div>error</div>
	              const word_list = data.Level[0].all_words
	              return(
	              		 <table>
	              		  <thead>
						    <tr>
						      <th>Word</th>
						      <th>Pinyin</th>
						      <th>Translation</th>
						      <th>Notes</th>
						      <th>Times Used</th>
						      <th>Level</th>
						    </tr>
						  </thead>
	              		<tbody>
	              		{word_list.map(word => {
	              			return(
		              			<tr>
		              			 <td>{word.text}</td>
		              			 <td>{word.pinyin}</td>
		              			 <td>{word.english}</td>
		              			 <td>{word.italics}</td>
		              			 <td>{word.times_used}</td>
		              			 <td>{word.level ? word.level.level_number : 0}</td>
		              			 <td><button onClick={() => this.editWord(word)}>Edit</button></td>
		              			</tr>
		              		)
	              		})}
	              		</tbody>
	              		</table>
	              )
	          	}
	      		}
	          </Query>
	      </header>
	    </div>
	  );
  	}
}

export default Words