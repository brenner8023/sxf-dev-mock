import {createStore} from 'redux';
import {schoolNav, commonSite, commonSoftware, bookList, csLearning, blog, gameList} from '../db';

let reducer = (state={list: schoolNav}, action) => {
    switch(action.type){
        case 'schoolNav':
            state = {...state, list: schoolNav};
            break;
        case 'commonSite':
            state = {...state, list: commonSite};
            break;
        case 'commonSoftware':
            state = {...state, list: commonSoftware};
            break;
        case 'bookList':
            state = {...state, list: bookList};
            break;
        case 'csLearning':
            state = {...state, list: csLearning};
            break;
        case 'blog':
            state = {...state, list: blog};
            break;
        case 'gameList':
            state = {...state, list: gameList};
            break;
        default:
            return state;
    }
    return state;
};

let store = createStore(reducer);

export {reducer, store};