import React from 'react';
import ReactDOM from 'react-dom';

import './static/css/reset.scss';
import './static/css/index.scss';
import './plugin';

import LogoBox from './component/LogoBox';
import Menu from './component/Menu';
import Items from './component/Items';
import {store} from './store/store';

const htmlCode = <div className="container">
    {/* github头像 */}
    <div className="github">
        <a href="https://github.com/brenner8023/gdutnav" target="_blank" rel="noopener noreferrer" title="Talk is cheap. Show me the code.">
            <svg viewBox="0 0 1024 1024"><path d="M512 12.64c-282.752 0-512 229.216-512 512 0 226.208 146.72 418.144 350.144 485.824 25.6 4.736 35.008-11.104 35.008-24.64 0-12.192-0.48-52.544-0.704-95.328-142.464 30.976-172.512-60.416-172.512-60.416-23.296-59.168-56.832-74.912-56.832-74.912-46.464-31.776 3.52-31.136 3.52-31.136 51.392 3.616 78.464 52.768 78.464 52.768 45.664 78.272 119.776 55.648 148.992 42.56 4.576-33.088 17.856-55.68 32.512-68.48-113.728-12.928-233.28-56.864-233.28-253.024 0-55.904 20-101.568 52.768-137.44-5.312-12.896-22.848-64.96 4.96-135.488 0 0 43.008-13.76 140.832 52.48 40.832-11.36 84.64-17.024 128.16-17.248 43.488 0.192 87.328 5.888 128.256 17.248 97.728-66.24 140.64-52.48 140.64-52.48 27.872 70.528 10.336 122.592 5.024 135.488 32.832 35.84 52.704 81.536 52.704 137.44 0 196.64-119.776 239.936-233.792 252.64 18.368 15.904 34.72 47.04 34.72 94.816 0 68.512-0.608 123.648-0.608 140.512 0 13.632 9.216 29.6 35.168 24.576 203.328-67.776 349.856-259.616 349.856-485.76 0-282.784-229.248-512-512-512z" fill="#1296db"></path></svg>
        </a>
    </div>

    {/* 搜索框组件(包括logo) */}
    <LogoBox />

    {/* 具体内容的组件 */}
    <div className="nav-box">
        <Menu store={store} />
        <Items store={store} />
    </div>
</div>;

ReactDOM.render(htmlCode, document.getElementById('root'));