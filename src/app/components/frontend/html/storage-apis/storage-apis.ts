import { Component } from '@angular/core';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';

@Component({
  standalone: true,
  imports: [TheoryBlockComponent, CodeBlockComponent, QuickRefComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent, PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './storage-apis.html',
  styleUrl: './storage-apis.scss'
})
export class HtmlStorageApis {

  quickRef: QuickRefItem[] = [
    { name: 'localStorage', type: 'keyword', desc: 'Stores data with no expiration date' },
    { name: 'sessionStorage', type: 'keyword', desc: 'Stores data for one session (data is lost when the browser tab closes)' },
    { name: 'IndexedDB', type: 'keyword', desc: 'Stores large amounts of structured data client-side' },
    { name: 'cookies', type: 'keyword', desc: 'Stores small amounts of data on the user\'s computer' },
    { name: 'capacity', type: 'keyword', desc: '<code>localStorage</code> and <code>sessionStorage</code>: 5-10 MB each. <code>IndexedDB</code>: up to several gigabytes. <code>Cookies</code>: 4KB per cookie, 20 cookies per domain.' },
    { name: 'scope', type: 'keyword', desc: '<code>localStorage</code> and <code>sessionStorage</code>: per origin (protocol, hostname, port). <code>IndexedDB</code>: per origin. <code>Cookies</code>: per domain/path.' },
    { name: 'persistence', type: 'keyword', desc: '<code>localStorage</code>: persists until deleted. <code>sessionStorage</code>: exists only while the browser tab is open. <code>IndexedDB</code>: can be set to persist or not. <code>Cookies</code>: can be set to expire.' },
    { name: 'security', type: 'keyword', desc: '<code>localStorage</code> and <code>sessionStorage</code>: not secure. <code>IndexedDB</code>: can be secured with HTTPS. <code>Cookies</code>: can be marked as HttpOnly, SameSite, Secure to enhance security.' }
  ];

  theory: TheoryPoint[] = [
    { heading: 'localStorage vs sessionStorage', points: ['<code>localStorage</code> persists data until cleared.', '<code>sessionStorage</code> exists only for the duration of a single session.'] },
    { heading: 'IndexedDB vs cookies', points: ['<code>IndexedDB</code> can store large amounts of structured data.', '<code>Cookies</code> are limited to small amounts and can be sent with every request.'] },
    { heading: 'Capacity', points: ['<code>localStorage</code> and <code>sessionStorage</code>: 5-10 MB each.', '<code>IndexedDB</code>: up to several gigabytes.', '<code>Cookies</code>: 4KB per cookie, 20 cookies per domain.'] },
    { heading: 'Scope', points: ['<code>localStorage</code> and <code>sessionStorage</code>: per origin (protocol, hostname, port).', '<code>IndexedDB</code>: per origin.', '<code>Cookies</code>: per domain/path.'] },
    { heading: 'Persistence', points: ['<code>localStorage</code>: persists until deleted.', '<code>sessionStorage</code>: exists only while the browser tab is open.', '<code>IndexedDB</code>: can be set to persist or not. <code>Cookies</code>: can be set to expire.'] }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'localStorage Example',
      language: 'html',
      code: `
        localStorage.setItem('username', 'JohnDoe');
        const username = localStorage.getItem('username'); // "JohnDoe"
        localStorage.removeItem('username');
        localStorage.clear();
      `
    },
    {
      label: 'sessionStorage Example',
      language: 'html',
      code: `
        sessionStorage.setItem('userToken', 'ABC123');
        const token = sessionStorage.getItem('userToken'); // "ABC123"
        sessionStorage.removeItem('userToken');
      `
    },
    {
      label: 'IndexedDB Example',
      language: 'html',
      code: `
        const request = indexedDB.open('myDatabase', 1);

        request.onupgradeneeded = function(event) {
          const db = event.target.result;
          const objectStore = db.createObjectStore('users', { keyPath: 'id' });
          objectStore.createIndex('name', 'name', { unique: false });
        };

        request.onsuccess = function(event) {
          const db = event.target.result;
          const transaction = db.transaction(['users'], 'readwrite');
          const objectStore = transaction.objectStore('users');

          const addRequest = objectStore.add({ id: 1, name: 'JaneDoe' });
          addRequest.onsuccess = function(event) {
            console.log('User added successfully');
          };

          const getRequest = objectStore.get(1);
          getRequest.onsuccess = function(event) {
            console.log(getRequest.result); // {id: 1, name: "JaneDoe"}
          };
        };
      `
    }
  ];

  mistakes: CommonMistake[] = [
    { title: 'Confusing localStorage and sessionStorage', wrong: 'localStorage is the same as sessionStorage.', right: 'localStorage persists data until deleted, while sessionStorage exists only for the duration of a single session.', explanation: 'sessionStorage is cleared when the tab closes; localStorage survives browser restarts until explicitly cleared.' },
    { title: 'Overestimating cookie capacity', wrong: 'Cookies can store up to 10 MB of data per domain.', right: 'Each cookie is limited to ~4 KB and there are typically 20-50 cookies per domain.', explanation: 'Cookie storage is very limited; use localStorage or IndexedDB for anything larger than a session token.' },
    { title: 'Misusing IndexedDB for simple data storage', wrong: 'Use IndexedDB for all client-side data.', right: 'Use localStorage for simple key-value pairs; IndexedDB for complex structured data.', explanation: 'IndexedDB has a much more complex async API — only reach for it when you need structured queries or large data sets.' },
    { title: 'Not using cookie security attributes', wrong: 'document.cookie = "token=abc";', right: 'document.cookie = "token=abc; HttpOnly; Secure; SameSite=Lax";', explanation: 'Without HttpOnly, scripts can read the cookie. Without Secure, it is sent over HTTP. Without SameSite, it is vulnerable to CSRF.' }
  ];

  challenge: Challenge = {
    title: 'Implement a Simple Storage Service',
    language: 'html',
    description: 'Create a simple storage service using localStorage that allows users to add, retrieve, and delete items.',
    hints: ['Use <code>localStorage.setItem</code>, <code>localStorage.getItem</code>, and <code>localStorage.removeItem</code> for storing and retrieving data.', 'Display the retrieved item in the UI after adding it.', 'Add functionality to delete an item from localStorage.'],
    starterCode: `
      // Add your code here
    `,
    solution: `
      function addData() {
        const key = document.getElementById('key').value;
        const value = document.getElementById('value').value;
        localStorage.setItem(key, value);
        displayData();
      }

      function getData() {
        const key = document.getElementById('key').value;
        const value = localStorage.getItem(key);
        alert(value);
      }

      function deleteData() {
        const key = document.getElementById('key').value;
        localStorage.removeItem(key);
        displayData();
      }

      function displayData() {
        const itemsDiv = document.getElementById('items');
        itemsDiv.innerHTML = '';
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const value = localStorage.getItem(key);
          itemsDiv.innerHTML += key + ': ' + value;
        }
      }

      document.getElementById('addButton').addEventListener('click', addData);
      document.getElementById('getButton').addEventListener('click', getData);
      document.getElementById('deleteButton').addEventListener('click', deleteData);

      displayData();
    `
  };

  quiz: QuizQuestion[] = [
    { q: 'Which API is best suited for storing large amounts of structured data?', options: ['localStorage', 'sessionStorage', 'IndexedDB'], answer: 2, explanation: '<code>IndexedDB</code> is designed to handle large and complex data structures.' },
    { q: 'What is the maximum size limit for cookies per domain?', options: ['5MB', '4KB', '10GB'], answer: 1, explanation: 'Each cookie can be up to 4KB in size, and there can be a maximum of 20 cookies per domain.' },
    { q: 'Which API is best suited for temporary data that should disappear when the browser tab closes?', options: ['localStorage', 'sessionStorage', 'IndexedDB'], answer: 1, explanation: '<code>sessionStorage</code> persists only as long as the browser tab is open.' },
    { q: 'What security attribute can be used to prevent cookies from being accessed by client-side scripts?', options: ['HttpOnly', 'SameSite', 'Secure'], answer: 0, explanation: 'The <code>HttpOnly</code> attribute prevents JavaScript from accessing the cookie, enhancing security.' },
    { q: 'Which API persists data until it is explicitly deleted?', options: ['localStorage', 'sessionStorage', 'IndexedDB'], answer: 0, explanation: '<code>localStorage</code> stores data indefinitely until cleared manually or by the application code.' }
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between localStorage and sessionStorage?', a: 'localStorage persists data until deleted, while sessionStorage exists only for the duration of a single session.' },
    { q: 'What security attributes can be used with cookies?', a: 'HttpOnly, SameSite, and Secure are common security attributes that can be used with cookies to enhance their security.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'localStorage vs sessionStorage vs IndexedDB vs cookies: capacity, scope, persistence, security.',
    mustKnow: ['Capacity of each API', 'Scope of data storage', 'Persistence of data', 'Security attributes for cookies'],
    interviewFocus: ['When to choose each API based on requirements', 'Best practices for using cookies securely']
  };
}

