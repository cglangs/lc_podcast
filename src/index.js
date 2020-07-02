import React from 'react'
import ReactDOM from 'react-dom'
import './styles/index.css'
import App from './components/App'
import { BrowserRouter } from 'react-router-dom'
import { getToken } from './token'
import { Provider, Client, dedupExchange, fetchExchange } from 'urql'
import { cacheExchange } from '@urql/exchange-graphcache'
import { GET_LEVEL_WORDS } from './components/Author'

const cache = cacheExchange({
  updates: {
    Mutation: {
      CreateSentence: (result, args, cache, info) => {
        cache.updateQuery({ query: GET_LEVEL_WORDS}, data => {
          if (data !== null) {
            //if interval == 1
            let index = data.Author[0].level.teachable_words.findIndex((word) => word.text === result.AddSentenceWord_taught.to.text)
            data.Author[0].level.addable_words.push(data.Author[0].level.teachable_words[index])
            data.Author[0].level.teachable_words.splice(index, 1);

            return data
          } else {
            return null
          }
        })
      }
    }
  }
})



const client = new Client({
  url: 'http://0.0.0.0:3003',
  fetchOptions: () => {
    const token = getToken()
    return {
      headers: { authorization: token ? `Bearer ${token}` : '' }
    }
  },
  exchanges: [dedupExchange, cache, fetchExchange]
  })

ReactDOM.render(
  <BrowserRouter>
    <Provider value={client}>
      <App />
    </Provider>
  </BrowserRouter>,
  document.getElementById('root')
)
