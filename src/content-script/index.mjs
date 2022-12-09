import 'github-markdown-css'
import MarkdownIt from 'markdown-it'
import Browser from 'webextension-polyfill'
import { getPossibleElementByQuerySelector } from './utils.mjs'
import { config } from './engine-match-config.mjs'
import './styles.css'

async function run(question) {
  const markdown = new MarkdownIt()

  const container = document.createElement('div')
  container.className = 'chat-gpt-container'
  container.innerHTML = '<p class="loading">Waiting for ChatGPT response...</p>'

  const siderbarContainer = getPossibleElementByQuerySelector(
    config[siteName].sidebarContainerQuery,
  )
  if (siderbarContainer) {
    siderbarContainer.prepend(container)
  } else {
    container.classList.add('sidebar-free')
    const appendContainer = getPossibleElementByQuerySelector(config[siteName].appendContainerQuery)
    if (appendContainer) appendContainer.appendChild(container)
  }

  const port = Browser.runtime.connect()
  port.onMessage.addListener(function (msg) {
    if (msg.answer) {
      container.innerHTML = '<div id="answer" class="markdown-body" dir="auto"></div>'
      container.querySelector('#answer').innerHTML = markdown.render(
        '**ChatGPT:**\n\n' + msg.answer,
      )
    } else if (msg.error === 'UNAUTHORIZED') {
      container.innerHTML =
        '<p>Please login at <a href="https://gpt.chatapi.art" target="_blank">gpt.chatapi.art</a> first</p>'
    } else {
      container.innerHTML = '<p>Failed to load response from ChatGPT</p>'
    }
  })
  port.postMessage({ question })
}

const matchedSites = Object.keys(config)
const siteRegex = new RegExp(`(${matchedSites.join('|')})`)
const siteName = document.location.hostname.match(siteRegex)[0]

const searchInput = getPossibleElementByQuerySelector(config[siteName].inputQuery)
if (searchInput && searchInput.value) {
  // only run on first page
  const startParam = new URL(location.href).searchParams.get('start') || '0'
  if (startParam === '0') {
    run(searchInput.value)
  }
}
