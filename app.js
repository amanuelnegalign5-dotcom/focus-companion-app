import {
  gregorianToEthiopian, ethiopianToGregorian, formatEthiopian,
  ETH_MONTHS_AM, ETH_MONTHS_EN, WEEKDAYS_AM, WEEKDAYS_EN, isEthiopianLeapYear
} from './calendar.js';

const APP_NAME = 'Focus Companion';
const VAULT_MARKER = 'focus-companion-vault-v1';
const KDF_ITERATIONS = 210000;
const appRoot = document.getElementById('app');
const modalRoot = document.getElementById('modal-root');
const state = {
  route: 'today', data: null, cryptoKey: null, vaultSalt: null,
  taskFilter: 'open', noteSearch: '', taskSearch: '', deferredInstallPrompt: null,
  focusPreset: 25, lastBackupFile: null
};
let tickHandle = null;
let persistQueue = Promise.resolve();

const DICT = {
  am: {
    today:'ዛሬ', capture:'መያዣ', tasks:'ተግባራት', knowledge:'እውቀት', review:'ግምገማ', settings:'ቅንብሮች',
    localPrivate:'የግል እና የተመሰጠረ', localPrivateDesc:'መዝገቦችዎ በዚህ መሣሪያ ላይ ተመስጥረው ይቀመጣሉ።',
    headingToday:'ዛሬ ለአስፈላጊው ቦታ ይስጡ', subtitleToday:'አእምሮዎን ያጽዱ። አስፈላጊውን ይምረጡ። አንድ እርምጃ ይውሰዱ።',
    captureThought:'ሐሳብዎን ያስቀምጡ', captureDesc:'ሐሳብን ወይም ማስታወሻን ወዲያውኑ ይመዝግቡ። ማደራጀት በኋላ ይቻላል።',
    addNote:'ማስታወሻ ጨምር', addTask:'ተግባር ጨምር', startFocus:'ትኩረት ጀምር', continueFocus:'ወደ ትኩረት ተመለስ',
    topThree:'የዛሬ 3 ቅድሚያዎች', topThreeDesc:'ዛሬ በጣም የሚያስፈልጉት።', chooseTop:'ከተግባሮች ውስጥ ይምረጡ',
    todayTasks:'የዛሬ ተግባራት', todayTasksDesc:'ትንሽ የሚቀጥለውን እርምጃ ይምረጡ።', recentNotes:'የቅርብ ማስታወሻዎች', recentNotesDesc:'በቅርቡ የተፈጠሩ ወይም የተቀየሩ።',
    openInbox:'ያልተደራጁ መዝገቦች', notesSaved:'ማስታወሻዎች', tasksDone:'የተጠናቀቁ', focusMinutes:'የትኩረት ደቂቃዎች',
    noTasks:'እስካሁን ተግባር የለም', noTasksDesc:'ከአእምሮዎ ውስጥ ያለውን ነገር ወደ ተግባር ይቀይሩ።', noNotes:'የእርስዎ የእውቀት ቦታ እዚህ ይጀምራል', noNotesDesc:'ሐሳብ፣ ጥናት፣ ግኝት ወይም ማንኛውንም ጠቃሚ መረጃ ያስቀምጡ።',
    seeAll:'ሁሉንም ይመልከቱ', search:'ፈልግ…', newNote:'አዲስ ማስታወሻ', all:'ሁሉም', open:'ያልተጠናቀቁ', done:'የተጠናቀቁ',
    inbox:'የመግቢያ ሳጥን', upcoming:'የሚመጡ', nextActions:'ቀጣይ እርምጃዎች', waiting:'በመጠባበቅ ላይ', someday:'አንድ ቀን', archived:'የተመዘገቡ',
    knowledgeTitle:'የእውቀት ቤተ-መዝገብ', knowledgeSubtitle:'ማስታወሻዎችዎን ያገናኙ፣ ይፈልጉ፣ እና ወደ ተግባር ይቀይሩ።',
    tasksTitle:'ተግባሮች እና ቀጣይ እርምጃዎች', tasksSubtitle:'ጠቃሚ ነገሮችን ግልጽ አድርጉ፤ አንድ በአንድ ይፈጽሙ።',
    captureTitle:'ፈጣን መያዣ', captureSubtitle:'ሐሳብዎን ከመርሳትዎ በፊት ያስቀምጡ።',
    reviewTitle:'ለማስተዋል እና ለማሻሻል ጊዜ', reviewSubtitle:'ምን እንደተንቀሳቀሰ ይመልከቱ፤ ቀጣዩን ሳምንት በግልጽነት ይጀምሩ።',
    settingsTitle:'የግል ቅንብሮች', settingsSubtitle:'ቋንቋ፣ ገጽታ፣ የውሂብ ባለቤትነት፣ እና መጫን።',
    noteTitle:'ርዕስ', noteBody:'ይዘት', noteType:'የማስታወሻ አይነት', tags:'መለያዎች', tagsHelp:'በኮማ ይለዩ።', relatedNotes:'ከሌሎች ማስታወሻዎች ጋር ያገናኙ',
    fleeting:'ፈጣን ሐሳብ', evergreen:'ዘላቂ ማስታወሻ', research:'ጥናት / ምርምር', journal:'የግል ማስታወሻ', meeting:'የስብሰባ ማስታወሻ', reference:'ምንጭ / ማጣቀሻ', daily:'የዕለት ማስታወሻ',
    taskTitle:'የተግባር ስም', details:'ዝርዝር ማብራሪያ (አማራጭ)', priority:'ቅድሚያ', high:'ከፍተኛ', medium:'መካከለኛ', low:'ዝቅተኛ', project:'ፕሮጀክት / አካባቢ', dueDate:'የማጠናቀቂያ ቀን (የኢትዮጵያ ዘመን)', setDueDate:'የቀን መጠን ያክሉ',
    save:'አስቀምጥ', cancel:'ይቅር', edit:'አስተካክል', delete:'ሰርዝ', complete:'አጠናቅቅ', reopen:'መልስ', favorite:'ተወዳጅ', removeFavorite:'ከተወዳጅ አውጣ',
    noSearchResults:'ምንም ውጤት አልተገኘም', noSearchDesc:'ሌላ ቃል ወይም መለያ ይሞክሩ።', related:'የተያያዙ', backlinks:'ወደዚህ የሚያመለክቱ',
    topAdded:'ወደ የዛሬ ቅድሚያ ተጨምሯል', topRemoved:'ከየዛሬ ቅድሚያ ተወግዷል', topLimit:'በአንድ ቀን ከ3 በላይ ቅድሚያ አይመርጡ።', saved:'ተቀምጧል', noteDeleted:'ማስታወሻው ተሰርዟል', taskDeleted:'ተግባሩ ተሰርዟል',
    start:'ጀምር', pause:'አቁም', resume:'ቀጥል', finish:'ጨርስ', focusTitle:'ጥልቅ ትኩረት', focusSubtitle:'አንድ ነገር ብቻ። ትንሽ ረጅም የትኩረት ጊዜ።',
    minutes:'ደቂቃ', focusSession:'የትኩረት ክፍለ ጊዜ', activeTask:'የሚሰሩት ተግባር', noLinkedTask:'ተግባር አልተመረጠም', distractions:'የተከፋፈለ ትኩረት', distractionPlaceholder:'ምን አስተጓጎለዎት?', logDistraction:'መዝግብ', focusDone:'ጥሩ ስራ። እረፍት ወይም ግምገማ ይምረጡ።', sessionSaved:'የትኩረት ጊዜ ተመዝግቧል',
    weeklyOverview:'የ7 ቀናት እይታ', completedTasks:'የተጠናቀቁ ተግባሮች', focusTime:'የትኩረት ጊዜ', notesCreated:'የተፈጠሩ ማስታወሻዎች', weeklyReflection:'የሳምንቱ ግምገማ', wentWell:'ምን ጥሩ ሄደ?', nextWeek:'ቀጣዩ ሳምንት ላይ ምን እመርጣለሁ?', learned:'ምን ተማርኩ?',
    language:'ቋንቋ', appearance:'ገጽታ', light:'ብርሃን', dark:'ጨለማ', privacy:'ግላዊነት እና ውሂብ', privacyDesc:'መረጃዎ በመሣሪያው ውስጥ ባለ የተመሰጠረ ቦታ ይቀመጣል። ከመሣሪያው አይላክም።',
    exportBackup:'የተመሰጠረ ቅጂ አውጣ', importBackup:'ቅጂ መልስ', lockNow:'አሁን ቆልፍ', installHelp:'ወደ መነሻ ማያ ገጽ ጨምር', shareApp:'መተግበሪያውን አጋራ', resetVault:'ሁሉንም ውሂብ ሰርዝ',
    installTitle:'Focus Companion ይጫኑ', installIos:'iPhone: በSafari ውስጥ አድራሻውን ይክፈቱ፣ Share ይጫኑ፣ Add to Home Screen ይምረጡ፣ Open as Web App ያብሩ እና Add ይጫኑ።', installAndroid:'Android: በChrome ውስጥ አድራሻውን ይክፈቱ፣ የሜኑ ምልክት ይጫኑ፣ Install app ወይም Add to Home screen ይምረጡ።', installDesktop:'Desktop: በChrome ወይም Edge የአድራሻ መስመር ላይ የInstall ምልክት ካለ ይጫኑ፣ ወይም ከሜኑ Install app ይምረጡ።',
    passphrase:'የደህንነት ሐረግ', confirmPassphrase:'የደህንነት ሐረጉን ድገም', unlock:'ክፈት', createVault:'የግል ቦታ ፍጠር', firstVaultTitle:'የእርስዎ የግል ሁለተኛ አእምሮ', unlockTitle:'የእርስዎን ቦታ ይክፈቱ', passphraseDesc:'የማስታወሻዎ እና የተግባርዎ ውሂብ በዚህ መሣሪያ ላይ በሐረግዎ ይመሰጠራል።', passphraseWarning:'አስፈላጊ፦ የደህንነት ሐረግዎን ካጡ ውሂብዎን መመለስ አይቻልም። ያለውን ሐረግ በደህና ያስቀምጡ፣ እና የተመሰጠረ ቅጂ ያውጡ።', passphraseMin:'ቢያንስ 10 ቁምፊዎች ይጠቀሙ።', noNetwork:'ያለ ክላውድ፣ ያለ መለያ፣ ያለ ማስታወቂያ።',
    passMismatch:'የደህንነት ሐረጎቹ አይዛመዱም።', badPassphrase:'ሐረጉ ትክክል አይደለም ወይም ቅጂው ተበላሽቷል።', secureContext:'የተመሰጠረ የግል ቦታ ለመጠቀም ይህን ጣቢያ በHTTPS አድራሻ ይክፈቱ። በቀጥታ ከZIP ፋይል መክፈት አይበቃም።',
    due:'ቀን', projectPlaceholder:'ለምሳሌ፦ የግል ጥናት', titlePlaceholder:'ርዕስ ይጻፉ…', notePlaceholder:'ሐሳብዎን እዚህ ይጻፉ…', taskPlaceholder:'ቀጣዩ እርምጃ ምንድነው?',
    confirmDeleteNote:'ይህን ማስታወሻ መሰረዝ ይፈልጋሉ?', confirmDeleteTask:'ይህን ተግባር መሰረዝ ይፈልጋሉ?', confirmReset:'ይህ በመሣሪያው የተቀመጠውን ሁሉንም ውሂብ በቋሚነት ይሰርዛል። የተመሰጠረ ቅጂ ካልዎት ብቻ ይቀጥሉ።', reset:'ውሂብ ሰርዝ',
    noReviews:'የሳምንት ግምገማ የለም', reviewSaved:'የግምገማ መዝገብ ተቀምጧል', today:'ዛሬ', yesterday:'ትናንት',
    exportDone:'የተመሰጠረ ቅጂ ወርዷል።', importDone:'ቅጂው ተመልሷል።', importError:'ቅጂው ሊከፈት አልቻለም። የደህንነት ሐረጉን ያረጋግጡ።',
    securityNote:'የመሣሪያው የተመሰጠረ ቦታ', securityNoteDesc:'ይዘቱ በIndexedDB ውስጥ AES-GCM ተመስጥሮ ይቀመጣል። በዚህ ስሪት ውስጥ የተመሰጠረ ቅጂ አስፈላጊ ነው።',
    lastUpdated:'የተሻሻለው', created:'የተፈጠረው', noDue:'ቀን የለም', noProject:'ፕሮጀክት የለም', tasksEmptyList:'የሚያሳዩት ተግባሮች የሉም', noLinkedNotes:'የተገናኙ ማስታወሻዎች የሉም',
    weekDays:['እሁድ','ሰኞ','ማክሰኞ','ረቡዕ','ሐሙስ','ዓርብ','ቅዳሜ'],
    noteCreated:'ማስታወሻው ተፈጥሯል።', taskCreated:'ተግባሩ ተፈጥሯል።',
  },
  en: {
    today:'Today', capture:'Capture', tasks:'Tasks', knowledge:'Knowledge', review:'Review', settings:'Settings',
    localPrivate:'Private & encrypted', localPrivateDesc:'Your records are encrypted on this device.',
    headingToday:'Make room for what matters', subtitleToday:'Clear your mind. Choose what matters. Take one next step.',
    captureThought:'Capture a thought', captureDesc:'Save an idea or note now. Organizing can come later.',
    addNote:'Add a note', addTask:'Add task', startFocus:'Start focus', continueFocus:'Return to focus',
    topThree:'Today’s Top 3', topThreeDesc:'The outcomes that matter most today.', chooseTop:'Choose from your tasks',
    todayTasks:'Today’s tasks', todayTasksDesc:'Choose one useful next action.', recentNotes:'Recent notes', recentNotesDesc:'Recently created or updated.',
    openInbox:'Unprocessed captures', notesSaved:'Notes', tasksDone:'Tasks completed', focusMinutes:'Focus minutes',
    noTasks:'No tasks yet', noTasksDesc:'Turn something on your mind into a concrete next action.', noNotes:'Your knowledge space starts here', noNotesDesc:'Capture an idea, insight, study note, or anything worth keeping.',
    seeAll:'View all', search:'Search…', newNote:'New note', all:'All', open:'Open', done:'Done',
    inbox:'Inbox', upcoming:'Upcoming', nextActions:'Next actions', waiting:'Waiting', someday:'Someday / Maybe', archived:'Archived',
    knowledgeTitle:'Knowledge vault', knowledgeSubtitle:'Connect, search, and put your knowledge to work.',
    tasksTitle:'Tasks & next actions', tasksSubtitle:'Make important work visible, then move it forward one step at a time.',
    captureTitle:'Quick capture', captureSubtitle:'Save a thought before it disappears.',
    reviewTitle:'Pause, notice, improve', reviewSubtitle:'See what moved forward and choose how to begin the next week.',
    settingsTitle:'Personal settings', settingsSubtitle:'Language, appearance, data ownership, and installation.',
    noteTitle:'Title', noteBody:'Content', noteType:'Note type', tags:'Tags', tagsHelp:'Separate tags with commas.', relatedNotes:'Link to other notes',
    fleeting:'Quick thought', evergreen:'Evergreen note', research:'Research', journal:'Journal', meeting:'Meeting note', reference:'Source / reference', daily:'Daily note',
    taskTitle:'Task title', details:'Details (optional)', priority:'Priority', high:'High', medium:'Medium', low:'Low', project:'Project / area', dueDate:'Due date (Ethiopian calendar)', setDueDate:'Set a due date',
    save:'Save', cancel:'Cancel', edit:'Edit', delete:'Delete', complete:'Complete', reopen:'Reopen', favorite:'Favorite', removeFavorite:'Remove favorite',
    noSearchResults:'No results found', noSearchDesc:'Try another word or tag.', related:'Related', backlinks:'Backlinks',
    topAdded:'Added to today’s priorities', topRemoved:'Removed from today’s priorities', topLimit:'Choose no more than three priorities per day.', saved:'Saved', noteDeleted:'Note deleted', taskDeleted:'Task deleted',
    start:'Start', pause:'Pause', resume:'Resume', finish:'Finish', focusTitle:'Deep focus', focusSubtitle:'One thing at a time. A little uninterrupted space.',
    minutes:'minutes', focusSession:'Focus session', activeTask:'Task for this session', noLinkedTask:'No task selected', distractions:'Distractions', distractionPlaceholder:'What pulled your attention?', logDistraction:'Log', focusDone:'Well done. Choose a break or review.', sessionSaved:'Focus session saved',
    weeklyOverview:'7-day overview', completedTasks:'Tasks completed', focusTime:'Focus time', notesCreated:'Notes created', weeklyReflection:'Weekly reflection', wentWell:'What went well?', nextWeek:'What will I prioritize next week?', learned:'What did I learn?',
    language:'Language', appearance:'Appearance', light:'Light', dark:'Dark', privacy:'Privacy & data', privacyDesc:'Your information is stored in an encrypted vault on this device. It is not uploaded.',
    exportBackup:'Export encrypted backup', importBackup:'Restore backup', lockNow:'Lock now', installHelp:'Add to home screen', shareApp:'Share app', resetVault:'Delete all local data',
    installTitle:'Install Focus Companion', installIos:'iPhone: Open this address in Safari, tap Share, choose Add to Home Screen, enable Open as Web App, then tap Add.', installAndroid:'Android: Open this address in Chrome, open the menu, then choose Install app or Add to Home screen.', installDesktop:'Desktop: In Chrome or Edge, use the install icon in the address bar or choose Install app from the menu.',
    passphrase:'Vault passphrase', confirmPassphrase:'Confirm passphrase', unlock:'Unlock', createVault:'Create private vault', firstVaultTitle:'Your private second brain', unlockTitle:'Unlock your vault', passphraseDesc:'Your notes and tasks are encrypted on this device with your passphrase.', passphraseWarning:'Important: If you lose your passphrase, your data cannot be recovered. Store it safely and export an encrypted backup.', passphraseMin:'Use at least 10 characters.', noNetwork:'No cloud. No account. No ads.',
    passMismatch:'Passphrases do not match.', badPassphrase:'The passphrase is incorrect or the backup is damaged.', secureContext:'Open this app from an HTTPS address to create an encrypted vault. Opening files directly from a ZIP is not enough.',
    due:'Due', projectPlaceholder:'e.g. personal study', titlePlaceholder:'Give it a title…', notePlaceholder:'Write your thought here…', taskPlaceholder:'What is the next action?',
    confirmDeleteNote:'Delete this note?', confirmDeleteTask:'Delete this task?', confirmReset:'This permanently deletes all data stored on this device. Continue only if you have a backup.', reset:'Delete data',
    noReviews:'No weekly reflection yet', reviewSaved:'Review saved', today:'Today', yesterday:'Yesterday',
    exportDone:'Encrypted backup downloaded.', importDone:'Backup restored.', importError:'Could not restore backup. Check the passphrase.',
    securityNote:'Encrypted device vault', securityNoteDesc:'Content is encrypted with AES-GCM in IndexedDB. An encrypted backup is important.',
    lastUpdated:'Updated', created:'Created', noDue:'No due date', noProject:'No project', tasksEmptyList:'No tasks to show', noLinkedNotes:'No linked notes',
    weekDays:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    noteCreated:'Note created.', taskCreated:'Task created.'
  }
};

function t(key) { return (DICT[state.data?.settings?.language || 'am'] || DICT.am)[key] ?? DICT.en[key] ?? key; }
function lang() { return state.data?.settings?.language || 'am'; }

const ICONS = {
  sparkles:'<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/><path d="m5 14 .8 1.8L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z"/>',
  inbox:'<path d="M4 4h16l1 10h-5l-2 3h-4l-2-3H3L4 4Z"/><path d="M3 14v5h18v-5"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  checkCircle:'<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
  book:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z"/><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20"/><path d="M8 7h8"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  list:'<path d="M9 6h12M9 12h12M9 18h12"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" transform="translate(1 1) scale(.92)"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  moon:'<path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/>',
  lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>',
  unlock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.5-2"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5"/><path d="M4 17v4h16v-4"/>',
  upload:'<path d="M12 15V3m-5 5 5-5 5 5"/><path d="M4 17v4h16v-4"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6"/><path d="M10 10v6m4-6v6"/>',
  edit:'<path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15l-0 5Z"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  link:'<path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"/>',
  file:'<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h7m-7 4h7"/>',
  tag:'<path d="M20 13 11 22l-9-9V2h11l7 7a3 3 0 0 1 0 4Z"/><circle cx="7" cy="7" r="1"/>',
  archive:'<path d="M3 4h18v4H3zM5 8v12h14V8m-9 4h4"/>',
  coffee:'<path d="M4 9h13v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9Z"/><path d="M17 10h2a2 2 0 0 1 0 4h-2M8 3v3m5-3v3"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  bookOpen:'<path d="M3 4h6a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H3zM21 4h-6a3 3 0 0 0-3 3v14a3 3 0 0 1 3-3h6z"/>',
  arrowLeft:'<path d="M19 12H5m6 6-6-6 6-6"/>',
  shield:'<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  sparkle:'<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  folder:'<path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 9h18"/>',
  checkSquare:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m7 12 3 3 7-7"/>',
};
function icon(name, size=18) { return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.sparkle}</svg>`; }
function esc(value='') { return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function newId() { return crypto.randomUUID ? crypto.randomUUID() : `fc-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function localParts(date = new Date()) { return {year:date.getFullYear(),month:date.getMonth()+1,day:date.getDate()}; }
function dateKey(date = new Date()) { const p=localParts(date); return `${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}`; }
function dateFromKey(key) { if (!key) return null; const [y,m,d]=key.split('-').map(Number); return new Date(y,m-1,d,12,0,0,0); }
function ethFromKey(key) { if (!key) return null; const [y,m,d]=key.split('-').map(Number); return gregorianToEthiopian(y,m,d); }
function displayEth(key, withWeekday=false) {
  if (!key) return t('noDue');
  const date=dateFromKey(key); const p=ethFromKey(key); const month=(lang()==='am'?ETH_MONTHS_AM:ETH_MONTHS_EN)[p.month-1];
  const dateText=lang()==='am'?`${month} ${p.day}, ${p.year}`:`${month} ${p.day}, ${p.year}`;
  return withWeekday ? `${(lang()==='am'?WEEKDAYS_AM:WEEKDAYS_EN)[date.getDay()]}, ${dateText}` : dateText;
}
function displayGregorian(date = new Date()) { return new Intl.DateTimeFormat(lang()==='am'?'am-ET':'en-GB',{day:'numeric',month:'short',year:'numeric'}).format(date); }
function todayEth() { return displayEth(dateKey(), true); }
function createEmptyData() { return {version:1,notes:[],tasks:[],sessions:[],reviews:[],settings:{language:'am',theme:'light'},currentFocus:null}; }
function isSecureCryptoAvailable() { return !!(globalThis.crypto && crypto.subtle && crypto.getRandomValues && indexedDB); }

function openVaultDb() {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('focus-companion-private-vault',1);
    request.onupgradeneeded=()=>{ if(!request.result.objectStoreNames.contains('vault')) request.result.createObjectStore('vault',{keyPath:'id'}); };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error || new Error('Could not open local vault.'));
  });
}
async function vaultGet() {
  const db=await openVaultDb();
  try { return await new Promise((resolve,reject)=>{ const tx=db.transaction('vault','readonly'); const req=tx.objectStore('vault').get('main'); req.onsuccess=()=>resolve(req.result||null); req.onerror=()=>reject(req.error); }); }
  finally { db.close(); }
}
async function vaultPut(envelope) {
  const db=await openVaultDb();
  try { await new Promise((resolve,reject)=>{ const tx=db.transaction('vault','readwrite'); tx.objectStore('vault').put({id:'main',...envelope}); tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error); tx.onabort=()=>reject(tx.error||new Error('Vault write aborted')); }); }
  finally { db.close(); }
}
async function vaultDelete() {
  const db=await openVaultDb();
  try { await new Promise((resolve,reject)=>{ const tx=db.transaction('vault','readwrite'); tx.objectStore('vault').delete('main'); tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error); }); }
  finally { db.close(); }
}
function bytesToBase64(bytes) { let binary=''; const step=0x8000; for(let i=0;i<bytes.length;i+=step) binary+=String.fromCharCode(...bytes.subarray(i,i+step)); return btoa(binary); }
function base64ToBytes(value) { const raw=atob(value); const out=new Uint8Array(raw.length); for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i); return out; }
async function deriveEncryptionKey(passphrase,salt,iterations=KDF_ITERATIONS) {
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(passphrase),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function encryptPayload(payload,key=state.cryptoKey,saltBase64=state.vaultSalt) {
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const plaintext=new TextEncoder().encode(JSON.stringify({marker:VAULT_MARKER,data:payload}));
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,plaintext);
  return {format:1,algorithm:'AES-GCM',kdf:'PBKDF2-SHA-256',iterations:KDF_ITERATIONS,salt:saltBase64,iv:bytesToBase64(iv),ciphertext:bytesToBase64(new Uint8Array(ciphertext))};
}
async function decryptPayload(envelope,passphrase) {
  if(!envelope || envelope.format!==1 || envelope.algorithm!=='AES-GCM' || envelope.kdf!=='PBKDF2-SHA-256') throw new Error('Unsupported backup format');
  const salt=base64ToBytes(envelope.salt);
  const key=await deriveEncryptionKey(passphrase,salt,envelope.iterations||KDF_ITERATIONS);
  const decrypted=await crypto.subtle.decrypt({name:'AES-GCM',iv:base64ToBytes(envelope.iv)},key,base64ToBytes(envelope.ciphertext));
  const parsed=JSON.parse(new TextDecoder().decode(decrypted));
  if(parsed.marker!==VAULT_MARKER || !parsed.data || !Array.isArray(parsed.data.notes) || !Array.isArray(parsed.data.tasks)) throw new Error('Invalid vault payload');
  return {data:parsed.data,key,saltBase64:envelope.salt};
}
async function persist() {
  if(!state.data || !state.cryptoKey || !state.vaultSalt) return;
  const snapshot=structuredClone(state.data);
  const key=state.cryptoKey, salt=state.vaultSalt;
  const task=async()=>{ const envelope=await encryptPayload(snapshot,key,salt); await vaultPut(envelope); };
  persistQueue=persistQueue.catch(()=>{}).then(task);
  return persistQueue;
}

function toast(message) {
  let region=document.querySelector('.toast-region');
  if(!region){ region=document.createElement('div'); region.className='toast-region'; region.setAttribute('role','status'); document.body.appendChild(region); }
  const node=document.createElement('div'); node.className='toast'; node.textContent=message; region.appendChild(node);
  setTimeout(()=>{node.remove(); if(!region.children.length)region.remove();},3300);
}
function navItems() {
  return [
    {route:'today',label:t('today'),icon:'sparkles'},
    {route:'capture',label:t('capture'),icon:'inbox'},
    {route:'tasks',label:t('tasks'),icon:'checkSquare'},
    {route:'knowledge',label:t('knowledge'),icon:'book'},
    {route:'review',label:t('review'),icon:'calendar'},
  ];
}
function brand() { return `<div class="brand"><div class="brand-mark">${icon('sparkles',23)}</div><div class="brand-copy"><div class="brand-title">Focus Companion</div><div class="brand-sub">የግል እውቀት እና ትኩረት</div></div></div>`; }
function renderNav(mobile=false) {
  return navItems().map(item=>`<button class="nav-item ${state.route===item.route?'active':''}" data-route="${item.route}" aria-current="${state.route===item.route?'page':'false'}">${icon(item.icon)}<span>${esc(item.label)}</span></button>`).join('');
}
function currentPageLabel() {
  if(state.route==='focus') return t('focusTitle');
  if(state.route==='settings') return t('settingsTitle');
  return t(state.route);
}
function applyAppearance() { document.documentElement.dataset.theme=state.data?.settings?.theme || 'light'; document.documentElement.lang=lang(); }
function render() {
  if(!state.data) return;
  applyAppearance();
  appRoot.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        ${brand()}
        <div class="nav-block"><div class="nav-kicker">${lang()==='am'?'ዋና ምናሌ':'Workspace'}</div>${renderNav()}</div>
        <div class="nav-block"><div class="nav-kicker">${lang()==='am'?'መሳሪያዎች':'Tools'}</div>
          <button class="nav-item ${state.route==='focus'?'active':''}" data-route="focus">${icon('clock')}<span>${esc(t('focusTitle'))}</span></button>
          <button class="nav-item ${state.route==='settings'?'active':''}" data-route="settings">${icon('settings')}<span>${esc(t('settings'))}</span></button>
        </div>
        <div class="sidebar-bottom"><div class="local-card"><div class="local-card-head"><span class="local-dot"></span>${esc(t('localPrivate'))}</div><p>${esc(t('localPrivateDesc'))}</p></div></div>
      </aside>
      <div class="main-column">
        <header class="topbar">
          <div class="topbar-left"><div class="brand-mark mobile-brand-mark">${icon('sparkles',20)}</div><div class="topbar-heading">${esc(currentPageLabel())} <span style="color:var(--muted)">· ${esc(todayEth())}</span></div></div>
          <div class="topbar-actions">
            <span class="status-pill" title="${esc(t('localPrivate'))}">${icon('shield')}<span>${esc(lang()==='am'?'በመሣሪያ ላይ':'On device')}</span></span>
            <button class="lang-button" data-action="toggle-language" aria-label="Switch language">${lang()==='am'?'EN':'አማ'}</button>
            <button class="icon-button" data-action="toggle-theme" aria-label="${esc(t('appearance'))}" title="${esc(t('appearance'))}">${icon(state.data.settings.theme==='dark'?'sun':'moon')}</button>
            <button class="icon-button" data-action="lock-now" aria-label="${esc(t('lockNow'))}" title="${esc(t('lockNow'))}">${icon('lock')}</button>
          </div>
        </header>
        <main class="content">${renderRoute()}</main>
      </div>
    </div>
    <nav class="mobile-bottom-nav" aria-label="Primary navigation">${renderNav(true)}</nav>`;
}
function statCard(label,value,foot,iconName) {
  return `<div class="card card-flat stat-card"><div><div class="stat-label">${esc(label)}</div><div class="stat-value">${esc(value)}</div><div class="stat-foot">${esc(foot)}</div></div><div class="stat-icon">${icon(iconName)}</div></div>`;
}
function emptyState(title,desc,buttonLabel,action,iconName='file') {
  return `<div class="empty-state"><div class="empty-icon">${icon(iconName,20)}</div><h3>${esc(title)}</h3><p>${esc(desc)}</p>${buttonLabel?`<button class="button button-secondary button-small" data-action="${action}">${icon('plus',14)}${esc(buttonLabel)}</button>`:''}</div>`;
}
function currentDayTasks() {
  const today=dateKey();
  return state.data.tasks.filter(x=>!x.completedAt && (x.dueDate===today || x.top3Date===today));
}
function topTasks() { return state.data.tasks.filter(x=>x.top3Date===dateKey()&&!x.completedAt).slice(0,3); }
function weekRangeStart() { const d=dateFromKey(dateKey()); d.setDate(d.getDate()-6); return dateKey(d); }
function sessionsThisWeek() { const start=weekRangeStart(); return state.data.sessions.filter(s=>(s.endAt||s.startedAt||'').slice(0,10)>=start && (s.endAt||s.startedAt||'').slice(0,10)<=dateKey()); }
function completedThisWeek() { const start=weekRangeStart(); return state.data.tasks.filter(x=>x.completedAt && x.completedAt.slice(0,10)>=start && x.completedAt.slice(0,10)<=dateKey()).length; }
function formatMinutes(seconds) { const minutes=Math.round((seconds||0)/60); if(minutes<60)return `${minutes} ${t('minutes')}`; const h=Math.floor(minutes/60),m=minutes%60; return `${h}h ${m}m`; }
function itemMeta(task) {
  const bits=[];
  if(task.priority==='high') bits.push(`<span><i class="priority-dot"></i>${esc(t('high'))}</span>`);
  if(task.dueDate) bits.push(`<span>${icon('calendar',12)} ${esc(displayEth(task.dueDate))}</span>`);
  if(task.project) bits.push(`<span>${icon('folder',12)} ${esc(task.project)}</span>`);
  return bits.length?`<div class="item-meta">${bits.join('')}</div>`:'';
}
function renderTaskRow(task,{topButton=false,compact=false}={}) {
  const completed=!!task.completedAt;
  return `<div class="${compact?'priority-item':'task-item'}" data-task-id="${esc(task.id)}">
    <button class="check-button ${completed?'checked':''}" data-action="toggle-task" data-id="${esc(task.id)}" aria-label="${completed?esc(t('reopen')):esc(t('complete'))}">${completed?icon('check',13):''}</button>
    <div class="item-content"><div class="item-title ${completed?'completed':''}">${esc(task.title)}</div>${task.details&&!compact?`<div class="note-excerpt">${esc(task.details)}</div>`:''}${itemMeta(task)}</div>
    <div class="note-actions">${topButton?`<button class="mini-button" data-action="toggle-top3" data-id="${esc(task.id)}" title="${esc(task.top3Date===dateKey()?t('removeFavorite'):t('topThree'))}">${icon(task.top3Date===dateKey()?'target':'plus',14)}</button>`:''}<button class="mini-button" data-action="edit-task" data-id="${esc(task.id)}" title="${esc(t('edit'))}">${icon('edit',14)}</button></div>
  </div>`;
}
function renderNoteRow(note,showActions=true) {
  const excerpt=(note.content||'').replace(/\s+/g,' ').trim();
  const tags=(note.tags||[]).slice(0,4).map(tag=>`<span class="tag">#${esc(tag)}</span>`).join('');
  const related=(note.links||[]).length;
  return `<div class="note-row" data-note-id="${esc(note.id)}"><div class="note-row-top"><div class="note-type-icon">${icon(note.type==='reference'?'link':note.type==='journal'?'heart':'file',16)}</div><div class="note-row-content"><button class="note-title-button" data-action="view-note" data-id="${esc(note.id)}">${esc(note.title||t('newNote'))}</button>${excerpt?`<p class="note-excerpt">${esc(excerpt.slice(0,180))}${excerpt.length>180?'…':''}</p>`:''}<div class="item-meta"><span>${esc(t('lastUpdated'))}: ${esc(displayEth(note.updatedAt?.slice(0,10)||note.createdAt?.slice(0,10)||dateKey()))}</span>${related?`<span>${icon('link',12)} ${related} ${esc(t('related'))}</span>`:''}</div>${tags?`<div class="tag-list">${tags}</div>`:''}</div>${showActions?`<div class="note-actions"><button class="mini-button" data-action="toggle-favorite" data-id="${esc(note.id)}" title="${esc(note.favorite?t('removeFavorite'):t('favorite'))}">${icon(note.favorite?'heart':'target',14)}</button><button class="mini-button" data-action="edit-note" data-id="${esc(note.id)}" title="${esc(t('edit'))}">${icon('edit',14)}</button><button class="mini-button" data-action="delete-note" data-id="${esc(note.id)}" title="${esc(t('delete'))}">${icon('trash',14)}</button></div>`:''}</div></div>`;
}
function renderToday() {
  const today=dateKey(), tasks=currentDayTasks(), top=topTasks();
  const notes=[...state.data.notes].sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||'')).slice(0,3);
  const taskCount=state.data.tasks.filter(x=>!x.completedAt).length;
  const inboxCount=state.data.notes.filter(x=>x.type==='fleeting'||!x.tags?.length).length;
  const todaySessions=state.data.sessions.filter(s=>(s.endAt||'').slice(0,10)===today);
  const focusSecs=todaySessions.reduce((sum,s)=>sum+(s.durationSeconds||0),0);
  const greet=lang()==='am'?'በደህና ጀምሩ':'A calmer start';
  const focusButton=state.data.currentFocus?`<button class="button button-primary" data-action="continue-focus">${icon('clock')}${esc(t('continueFocus'))}</button>`:`<button class="button button-primary" data-route="focus">${icon('clock')}${esc(t('startFocus'))}</button>`;
  return `
    <section class="hero-card">
      <div class="eyebrow">${esc(greet)}</div>
      <h1>${esc(t('headingToday'))}</h1>
      <p>${esc(t('subtitleToday'))}</p>
      <div class="hero-bottom"><div class="date-stack"><div class="date-primary">${esc(todayEth())}</div><div class="date-secondary">${esc(displayGregorian())} · ${esc(lang()==='am'?'የግሪጎሪያን ዘመን':'Gregorian calendar')}</div></div><div>${focusButton}</div></div>
    </section>
    <div class="grid grid-3" style="margin-top:16px">
      ${statCard(t('openInbox'),String(inboxCount),lang()==='am'?'ሊደራጁ የሚችሉ':'Could be organized','inbox')}
      ${statCard(t('tasksDone'),String(completedThisWeek()),lang()==='am'?'በመጨረሻዎቹ 7 ቀናት':'In the last 7 days','checkCircle')}
      ${statCard(t('focusMinutes'),formatMinutes(sessionsThisWeek().reduce((sum,s)=>sum+(s.durationSeconds||0),0)),lang()==='am'?'በመጨረሻዎቹ 7 ቀናት':'In the last 7 days','clock')}
    </div>
    <div class="grid grid-main" style="margin-top:18px">
      <div class="stack">
        <section class="card"><div class="section-heading"><div><h2>${esc(t('topThree'))}</h2><p>${esc(t('topThreeDesc'))}</p></div><span class="pill ${top.length?'pill-green':''}">${top.length}/3</span></div>
          ${top.length?`<div class="top3-list">${top.map((task,i)=>`<div class="top3-card"><div class="top3-number">${i+1}</div><div class="item-content"><div class="item-title">${esc(task.title)}</div>${itemMeta(task)}</div><button class="mini-button" data-action="toggle-top3" data-id="${esc(task.id)}" title="${esc(t('removeFavorite'))}">${icon('close',13)}</button></div>`).join('')}</div>`:emptyState(t('noTasks'),t('chooseTop'),t('addTask'),'add-task','target')}
        </section>
        <section class="card"><div class="section-heading"><div><h2>${esc(t('todayTasks'))}</h2><p>${esc(t('todayTasksDesc'))}</p></div><button class="link-button" data-route="tasks">${esc(t('seeAll'))}${icon('arrow',13)}</button></div>
          ${tasks.length?`<div class="task-list">${tasks.slice(0,5).map(task=>renderTaskRow(task,{topButton:true})).join('')}</div>`:emptyState(t('noTasks'),t('noTasksDesc'),t('addTask'),'add-task','checkSquare')}
          <div style="margin-top:14px"><button class="button button-secondary button-small" data-action="add-task">${icon('plus',14)}${esc(t('addTask'))}</button></div>
        </section>
      </div>
      <div class="stack">
        <section class="card"><div class="section-heading"><div><h2>${esc(t('captureThought'))}</h2><p>${esc(t('captureDesc'))}</p></div><div class="card-icon">${icon('inbox')}</div></div><button class="button button-primary" style="width:100%" data-action="add-note">${icon('plus',15)}${esc(t('addNote'))}</button><button class="button button-secondary" style="width:100%;margin-top:8px" data-action="add-task">${icon('checkSquare',15)}${esc(t('addTask'))}</button></section>
        <section class="card"><div class="section-heading"><div><h2>${esc(t('recentNotes'))}</h2><p>${esc(t('recentNotesDesc'))}</p></div><button class="link-button" data-route="knowledge">${esc(t('seeAll'))}${icon('arrow',13)}</button></div>
          ${notes.length?notes.map(n=>renderNoteRow(n)).join(''):emptyState(t('noNotes'),t('noNotesDesc'),t('addNote'),'add-note','book')}
        </section>
        <section class="card card-flat"><div class="card-title-group"><div class="card-icon">${icon('shield')}</div><div><h3>${esc(t('localPrivate'))}</h3><p class="card-note">${esc(lang()==='am'?'ለመክፈት ሐረግ ያስፈልጋል፤ ከክላውድ ጋር ግንኙነት የለም።':'Your vault requires a passphrase. No cloud connection.')}</p></div></div></section>
      </div>
    </div>`;
}
function renderCapture() {
  return `<div class="page-heading"><div><div class="eyebrow">${esc(lang()==='am'?'በመጀመሪያ ይያዙ':'CAPTURE FIRST')}</div><h1>${esc(t('captureTitle'))}</h1><p class="page-subtitle">${esc(t('captureSubtitle'))}</p></div></div>
    <div class="grid grid-main"><section class="card"><div class="card-header"><div class="card-title-group"><div class="card-icon">${icon('inbox')}</div><div><h2>${esc(t('captureThought'))}</h2><p class="card-note">${esc(t('captureDesc'))}</p></div></div></div><button class="button button-primary" data-action="add-note">${icon('plus')}${esc(t('addNote'))}</button><button class="button button-secondary" data-action="add-task" style="margin-left:8px">${icon('checkSquare')}${esc(t('addTask'))}</button><div class="small-divider"></div><h3>${esc(t('inbox'))}</h3><p class="card-note">${esc(lang()==='am'?'ምድብ ወይም መለያ የሌላቸው ማስታወሻዎች እዚህ ይታያሉ።':'Notes without tags or marked as quick thoughts appear here.')}</p>
    <div style="margin-top:12px">${state.data.notes.filter(n=>n.type==='fleeting'||!n.tags?.length).length?state.data.notes.filter(n=>n.type==='fleeting'||!n.tags?.length).sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||'')).map(n=>renderNoteRow(n)).join(''):emptyState(lang()==='am'?'መያዣ ሳጥኑ ባዶ ነው':'Inbox is clear',lang()==='am'?'አዲስ ሐሳብ ያክሉ ወይም በማስታወሻ ላይ መለያ ያስገቡ።':'Capture an idea or add tags to notes as you organize them.',t('addNote'),'add-note','inbox')}</div></section>
    <section class="card"><h2>${esc(lang()==='am'?'ፈጣን የማስታወሻ ሂደት':'A simple capture habit')}</h2><div class="stack" style="margin-top:17px"><div class="focus-side-stat"><span>01</span><div class="item-content"><div class="item-title">${esc(lang()==='am'?'ያለውን ይጻፉ':'Write it down')}</div><div class="card-note">${esc(lang()==='am'?'አስተሳሰብዎን ከማደራጀት በፊት ያስቀምጡ።':'Capture before trying to organize.')}</div></div></div><div class="focus-side-stat"><span>02</span><div class="item-content"><div class="item-title">${esc(lang()==='am'?'ግልጽ ርዕስ ይስጡ':'Give it a useful title')}</div><div class="card-note">${esc(lang()==='am'?'በኋላ በፍለጋ ለማግኘት ይረዳል።':'A clear title helps future retrieval.')}</div></div></div><div class="focus-side-stat"><span>03</span><div class="item-content"><div class="item-title">${esc(lang()==='am'?'ከሚያስፈልግ ሌላ ነገር ጋር ያገናኙ':'Connect it when useful')}</div><div class="card-note">${esc(lang()==='am'?'ከተግባር፣ ፕሮጀክት ወይም ሌላ ማስታወሻ ጋር ያገናኙ።':'Link it to a task, project, or note when relevant.')}</div></div></div></div></section></div>`;
}
function renderKnowledge() {
  const q=state.noteSearch.trim().toLowerCase();
  const notes=[...state.data.notes].filter(n=>!q||[n.title,n.content,...(n.tags||[])].join(' ').toLowerCase().includes(q)).sort((a,b)=>(b.favorite-a.favorite)||((b.updatedAt||'').localeCompare(a.updatedAt||'')));
  return `<div class="page-heading"><div><div class="eyebrow">${esc(lang()==='am'?'ማስታወስ · ማገናኘት · መመለስ':'REMEMBER · CONNECT · RETRIEVE')}</div><h1>${esc(t('knowledgeTitle'))}</h1><p class="page-subtitle">${esc(t('knowledgeSubtitle'))}</p></div><button class="button button-primary" data-action="add-note">${icon('plus')}${esc(t('newNote'))}</button></div>
    <div class="toolbar"><div class="search-wrap">${icon('search')}<input class="search-input" id="note-search" data-search="notes" type="search" placeholder="${esc(t('search'))}" value="${esc(state.noteSearch)}" autocomplete="off"></div><div class="toolbar-right"><span class="pill">${state.data.notes.length} ${esc(t('notesSaved'))}</span></div></div>
    <section class="card card-flat">${notes.length?notes.map(note=>{
      const backlinks=state.data.notes.filter(other=>(other.links||[]).includes(note.id)).length;
      return renderNoteRow(note)+`<div class="item-meta" style="padding-left:43px;margin-top:-1px">${icon('link',12)} ${backlinks} ${esc(t('backlinks'))}</div>`;
    }).join(''):emptyState(q?t('noSearchResults'):t('noNotes'),q?t('noSearchDesc'):t('noNotesDesc'),t('addNote'),'add-note','book')}</section>`;
}
function renderTasks() {
  const q=state.taskSearch.trim().toLowerCase();
  let tasks=[...state.data.tasks].filter(task=>!q||[task.title,task.details,task.project].join(' ').toLowerCase().includes(q));
  if(state.taskFilter==='open') tasks=tasks.filter(x=>!x.completedAt);
  if(state.taskFilter==='done') tasks=tasks.filter(x=>!!x.completedAt);
  if(state.taskFilter==='today') tasks=tasks.filter(x=>x.dueDate===dateKey()||x.top3Date===dateKey());
  if(state.taskFilter==='upcoming') tasks=tasks.filter(x=>!x.completedAt&&x.dueDate&&x.dueDate>dateKey());
  tasks.sort((a,b)=>{
    if(!!a.completedAt!==!!b.completedAt) return a.completedAt?1:-1;
    const rank={high:0,medium:1,low:2}; if(rank[a.priority]!==rank[b.priority])return rank[a.priority]-rank[b.priority];
    return (a.dueDate||'9999').localeCompare(b.dueDate||'9999')||(b.createdAt||'').localeCompare(a.createdAt||'');
  });
  const filters=[['open',t('open')],['today',t('today')],['upcoming',t('upcoming')],['done',t('done')],['all',t('all')]];
  return `<div class="page-heading"><div><div class="eyebrow">${esc(lang()==='am'?'ግልጽ የሚቀጥለው እርምጃ':'ONE CLEAR NEXT ACTION')}</div><h1>${esc(t('tasksTitle'))}</h1><p class="page-subtitle">${esc(t('tasksSubtitle'))}</p></div><button class="button button-primary" data-action="add-task">${icon('plus')}${esc(t('addTask'))}</button></div>
    <div class="toolbar"><div class="toolbar-left">${filters.map(([id,label])=>`<button class="filter-chip ${state.taskFilter===id?'active':''}" data-action="task-filter" data-filter="${id}">${esc(label)}</button>`).join('')}</div><div class="search-wrap">${icon('search')}<input class="search-input" id="task-search" data-search="tasks" type="search" placeholder="${esc(t('search'))}" value="${esc(state.taskSearch)}" autocomplete="off"></div></div>
    <div class="grid grid-main"><section class="card card-flat">${tasks.length?`<div class="task-list">${tasks.map(task=>renderTaskRow(task,{topButton:true})).join('')}</div>`:emptyState(t('tasksEmptyList'),t('noTasksDesc'),t('addTask'),'add-task','checkSquare')}</section><aside class="stack"><section class="card"><h2>${esc(t('topThree'))}</h2><p class="card-note">${esc(t('topThreeDesc'))}</p><div style="margin-top:14px" class="top3-list">${topTasks().length?topTasks().map((task,i)=>`<div class="top3-card"><div class="top3-number">${i+1}</div><div class="item-content"><div class="item-title">${esc(task.title)}</div></div><button class="mini-button" data-action="toggle-top3" data-id="${esc(task.id)}">${icon('close',13)}</button></div>`).join(''): `<p class="privacy-copy">${esc(t('chooseTop'))}</p>`}</div></section><section class="card"><div class="card-icon" style="margin-bottom:12px">${icon('target')}</div><h3>${esc(lang()==='am'?'ከተግባር በፊት ግልጽ አድርጉ':'Make the next action concrete')}</h3><p class="card-note">${esc(lang()==='am'?'“ፕሮጀክቱን ማሻሻል” ይልቅ “የመጀመሪያውን ክፍል ለ20 ደቂቃ መጻፍ” ይጠቀሙ።':'Prefer a small observable action over a vague outcome.')}</p></section></aside></div>`;
}
function sessionElapsed(session) {
  if(!session) return 0;
  const elapsedBefore=session.elapsedBeforePause||0;
  return elapsedBefore + (!session.paused&&session.startedAt?Math.max(0,(Date.now()-session.startedAt)/1000):0);
}
function currentRemaining() { const f=state.data.currentFocus; if(!f)return state.focusPreset*60; return Math.max(0,f.durationSeconds-sessionElapsed(f)); }
function timerDisplay(seconds) { const s=Math.max(0,Math.ceil(seconds)); return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }
function renderFocus() {
  const f=state.data.currentFocus;
  const duration=f?.durationSeconds||state.focusPreset*60;
  const elapsed=f?sessionElapsed(f):0;
  const remaining=f?Math.max(0,duration-elapsed):duration;
  const progress=f?Math.min(360,(elapsed/duration)*360):0;
  const pct=f?Math.min(100,Math.round(elapsed/duration*100)):0;
  const linked=f?.taskId?state.data.tasks.find(t=>t.id===f.taskId):null;
  const sessions=sessionsThisWeek();
  return `<div class="page-heading"><div><div class="eyebrow">${esc(lang()==='am'?'አንድ ነገር · አንድ ክፍለ ጊዜ':'ONE THING · ONE SESSION')}</div><h1>${esc(t('focusTitle'))}</h1><p class="page-subtitle">${esc(t('focusSubtitle'))}</p></div><button class="button button-secondary" data-route="today">${icon('arrowLeft',14)}${esc(t('today'))}</button></div>
    <div class="focus-layout"><section class="card focus-main-card"><div class="pill ${f?'pill-green':''}">${esc(f?(f.paused?t('pause'):t('focusSession')):t('focusSession'))}</div><div class="timer-ring" id="timer-ring" style="--progress:${progress}deg"><div class="timer-inner"><div class="timer-time" id="timer-value">${timerDisplay(remaining)}</div><div class="timer-caption" id="timer-caption">${esc(f?(f.paused?(lang()==='am'?'ቆሟል':'Paused'):(linked?.title||t('focusSession'))):(lang()==='am'?'የመጀመሪያ ክፍለ ጊዜ':'Ready when you are'))}</div></div></div>
    ${!f?`<div class="preset-row">${[[25,5],[50,10],[90,0]].map(([m,b])=>`<button class="preset ${state.focusPreset===m?'active':''}" data-action="select-preset" data-minutes="${m}"><strong>${m} ${esc(t('minutes'))}</strong>${b?`${b} ${esc(lang()==='am'?'ዕረፍት':'break')}`:esc(lang()==='am'?'ያለ ዕረፍት':'no break')}</button>`).join('')}</div><div class="field" style="width:min(340px,100%);margin-top:17px;text-align:left"><label for="focus-task-select">${esc(t('activeTask'))}</label><select id="focus-task-select"><option value="">${esc(t('noLinkedTask'))}</option>${state.data.tasks.filter(x=>!x.completedAt).map(task=>`<option value="${esc(task.id)}">${esc(task.title)}</option>`).join('')}</select></div><button class="button button-primary" style="margin-top:15px;min-width:170px" data-action="begin-focus">${icon('clock')}${esc(t('start'))}</button>`:
    `<div class="focus-controls">${f.paused?`<button class="button button-primary" data-action="resume-focus">${icon('arrow')}${esc(t('resume'))}</button>`:`<button class="button button-secondary" data-action="pause-focus">${icon('coffee')}${esc(t('pause'))}</button>`}<button class="button button-primary" data-action="finish-focus">${icon('check')}${esc(t('finish'))}</button></div><div class="field" style="width:min(350px,100%);margin-top:18px;text-align:left"><label for="distraction-input">${esc(t('distractions'))}</label><div style="display:flex;gap:7px"><input id="distraction-input" class="search-input" style="padding-left:12px" placeholder="${esc(t('distractionPlaceholder'))}"><button class="button button-secondary button-small" data-action="log-distraction">${esc(t('logDistraction'))}</button></div><p class="field-help">${esc(lang()==='am'?'ሐሳቡን ይመዝግቡና ወደ ስራው ይመለሱ።':'Capture the thought and return to the task.')}</p></div>`}</section>
    <aside class="stack"><section class="card"><div class="card-header"><div class="card-title-group"><div class="card-icon">${icon('target')}</div><div><h2>${esc(lang()==='am'?'የትኩረት መዝገብ':'Session context')}</h2><p class="card-note">${esc(lang()==='am'?'እንደ አስፈላጊነቱ ይጠቀሙ።':'Keep the session intentional.')}</p></div></div></div><div class="focus-side-stat"><span>${esc(t('activeTask'))}</span><strong style="font-size:11px;text-align:right;max-width:58%">${esc(linked?.title||t('noLinkedTask'))}</strong></div><div class="focus-side-stat"><span>${esc(t('weeklyOverview'))}</span><strong>${esc(formatMinutes(sessions.reduce((n,s)=>n+(s.durationSeconds||0),0)))}</strong></div><div class="focus-side-stat"><span>${esc(t('completedTasks'))}</span><strong>${completedThisWeek()}</strong></div><div class="small-divider"></div><p class="privacy-copy">${esc(lang()==='am'?'25/5፣ 50/10 እና 90 ደቂቃ የሚስተካከሉ አማራጮች ናቸው። አንድ ጊዜ ላይ ለሁሉም የሚመች ጊዜ አይደለም።':'25/5, 50/10, and 90-minute blocks are adjustable options, not universal scientific rules.')}</p></section><section class="card"><h3>${esc(lang()==='am'?'የክፍለ ጊዜ መነሻ ሐሳብ':'A useful session intention')}</h3><p class="review-quote">${esc(lang()==='am'?'“ይህን ክፍለ ጊዜ ጠቃሚ የሚያደርገው ምንድነው?”':'“What would make this session useful?”')}</p></section></aside></div>`;
}
function renderReview() {
  const today=dateKey();
  const thisReview=state.data.reviews.find(r=>r.date===today) || {wentWell:'',nextWeek:'',learned:''};
  const days=[]; for(let i=6;i>=0;i--){ const d=dateFromKey(today); d.setDate(d.getDate()-i); days.push(d); }
  const byDay=days.map(d=>{const k=dateKey(d);return {date:d,key:k,secs:state.data.sessions.filter(s=>(s.endAt||'').slice(0,10)===k).reduce((sum,s)=>sum+(s.durationSeconds||0),0)};});
  const max=Math.max(1,...byDay.map(x=>x.secs));
  const bars=byDay.map(x=>`<div class="week-bar-col"><div class="week-bar-value">${x.secs?Math.round(x.secs/60):'0'}</div><div class="week-bar ${x.key===today?'today':''}" style="height:${Math.max(3,x.secs/max*88)}%"></div><div class="week-bar-label">${esc((lang()==='am'?WEEKDAYS_AM:WEEKDAYS_EN)[x.date.getDay()])}</div></div>`).join('');
  return `<div class="page-heading"><div><div class="eyebrow">${esc(lang()==='am'?'ማየት · መማር · ማስተካከል':'NOTICE · LEARN · ADJUST')}</div><h1>${esc(t('reviewTitle'))}</h1><p class="page-subtitle">${esc(t('reviewSubtitle'))}</p></div></div>
  <div class="grid grid-3">${statCard(t('completedTasks'),String(completedThisWeek()),lang()==='am'?'ባለፉት 7 ቀናት':'Last 7 days','checkCircle')}${statCard(t('focusTime'),formatMinutes(sessionsThisWeek().reduce((sum,s)=>sum+(s.durationSeconds||0),0)),lang()==='am'?'ባለፉት 7 ቀናት':'Last 7 days','clock')}${statCard(t('notesCreated'),String(state.data.notes.filter(n=>(n.createdAt||'').slice(0,10)>=weekRangeStart()).length),lang()==='am'?'ባለፉት 7 ቀናት':'Last 7 days','file')}</div>
  <div class="grid grid-main" style="margin-top:18px"><section class="card"><div class="section-heading"><div><h2>${esc(t('weeklyOverview'))}</h2><p>${esc(lang()==='am'?'የተመዘገቡ የትኩረት ደቂቃዎች':'Recorded focus minutes per day')}</p></div><span class="pill">7 days</span></div><div class="week-bars">${bars}</div><p class="card-note">${esc(lang()==='am'?'ይህ የተመዘገበውን ብቻ ያሳያል፤ የግል ዋጋዎን አይለካም።':'This shows recorded activity, not your personal worth.')}</p></section>
  <section class="card"><div class="card-header"><div><h2>${esc(t('weeklyReflection'))}</h2><p class="card-note">${esc(displayEth(today,true))}</p></div><div class="card-icon">${icon('sparkles')}</div></div><form data-form="review"><div class="field"><label for="review-well">${esc(t('wentWell'))}</label><textarea id="review-well" name="wentWell" rows="3" placeholder="${esc(lang()==='am'?'ያከናወንኩትን ትንሽ እድገት ጻፍ…':'A small win worth noticing…')}">${esc(thisReview.wentWell)}</textarea></div><div class="field" style="margin-top:12px"><label for="review-learned">${esc(t('learned'))}</label><textarea id="review-learned" name="learned" rows="3" placeholder="${esc(lang()==='am'?'ምን አወቅሁ?':'What did I notice?')}">${esc(thisReview.learned)}</textarea></div><div class="field" style="margin-top:12px"><label for="review-next">${esc(t('nextWeek'))}</label><textarea id="review-next" name="nextWeek" rows="3" placeholder="${esc(lang()==='am'?'ቀጣዩ ግልጽ እርምጃ…':'One clear next step…')}">${esc(thisReview.nextWeek)}</textarea></div><div class="form-actions"><button class="button button-primary" type="submit">${icon('check')}${esc(t('save'))}</button></div></form></section></div>`;
}
function renderSettings() {
  const langLabel=lang()==='am'?'አማርኛ':'English';
  return `<div class="page-heading"><div><div class="eyebrow">${esc(lang()==='am'?'በእርስዎ መንገድ':'YOUR SPACE, YOUR RULES')}</div><h1>${esc(t('settingsTitle'))}</h1><p class="page-subtitle">${esc(t('settingsSubtitle'))}</p></div></div><div class="grid grid-main"><section class="card"><div class="card-header"><div class="card-title-group"><div class="card-icon">${icon('settings')}</div><div><h2>${esc(lang()==='am'?'መልክ እና ቋንቋ':'Appearance & language')}</h2><p class="card-note">${esc(lang()==='am'?'በፈለጉት ጊዜ ይቀይሩ።':'Change these at any time.')}</p></div></div></div><div class="setting-row"><div><div class="setting-title">${esc(t('language'))}</div><div class="setting-desc">${esc(lang()==='am'?'የመተግበሪያው ቋንቋ።':'The application language.')}</div></div><button class="button button-secondary button-small" data-action="toggle-language">${esc(langLabel)}</button></div><div class="setting-row"><div><div class="setting-title">${esc(t('appearance'))}</div><div class="setting-desc">${esc(lang()==='am'?'የቀን ወይም የሌሊት ገጽታ ይምረጡ።':'Choose light or dark appearance.')}</div></div><button class="button button-secondary button-small" data-action="toggle-theme">${icon(state.data.settings.theme==='dark'?'sun':'moon',14)}${esc(t(state.data.settings.theme==='dark'?'light':'dark'))}</button></div></section>
  <section class="card"><div class="card-header"><div class="card-title-group"><div class="card-icon">${icon('shield')}</div><div><h2>${esc(t('privacy'))}</h2><p class="card-note">${esc(t('privacyDesc'))}</p></div></div></div><div class="setting-row"><div><div class="setting-title">${esc(t('securityNote'))}</div><div class="setting-desc">${esc(t('securityNoteDesc'))}</div></div><span class="pill pill-green">AES-GCM</span></div><div class="setting-row"><div><div class="setting-title">${esc(t('exportBackup'))}</div><div class="setting-desc">${esc(lang()==='am'?'የተመሰጠረ ፋይል ያውጡ። ለመመለስ የተጠቀሙት ሐረግ ያስፈልጋል።':'Export an encrypted file. Restoring requires the passphrase used for that backup.')}</div></div><button class="button button-secondary button-small" data-action="export-backup">${icon('download',14)}${esc(lang()==='am'?'አውጣ':'Export')}</button></div><div class="setting-row"><div><div class="setting-title">${esc(t('importBackup'))}</div><div class="setting-desc">${esc(lang()==='am'?'የተመሰጠረ ቅጂ በመሣሪያው ላይ ይመልሱ።':'Restore an encrypted backup onto this device.')}</div></div><button class="button button-secondary button-small" data-action="import-backup">${icon('upload',14)}${esc(lang()==='am'?'መልስ':'Restore')}</button></div></section>
  <section class="card"><div class="card-header"><div class="card-title-group"><div class="card-icon">${icon('download')}</div><div><h2>${esc(lang()==='am'?'በመሣሪያዎ ላይ ይጫኑ':'Install on your device')}</h2><p class="card-note">${esc(lang()==='am'?'እንደ መተግበሪያ ከመነሻ ማያ ገጽ ይክፈቱ።':'Launch in its own window from your home screen.')}</p></div></div></div><button class="button button-primary" data-action="install-help">${icon('download')}${esc(t('installHelp'))}</button><button class="button button-secondary" style="margin-left:7px" data-action="share-app">${icon('arrow')}${esc(t('shareApp'))}</button></section>
  <section class="card"><div class="card-header"><div class="card-title-group"><div class="card-icon">${icon('lock')}</div><div><h2>${esc(lang()==='am'?'መዝጋት እና መጀመር':'Lock & reset')}</h2><p class="card-note">${esc(lang()==='am'?'ስራውን ሲጨርሱ የግል ቦታውን ይቆልፉ።':'Lock the private vault when you step away.')}</p></div></div></div><div class="setting-row"><div><div class="setting-title">${esc(t('lockNow'))}</div><div class="setting-desc">${esc(lang()==='am'?'የተከፈተውን ቦታ ይዝጉ።':'Close the unlocked workspace.')}</div></div><button class="button button-secondary button-small" data-action="lock-now">${icon('lock',14)}${esc(t('lockNow'))}</button></div><div class="setting-row"><div><div class="setting-title" style="color:var(--danger)">${esc(t('resetVault'))}</div><div class="setting-desc">${esc(lang()==='am'?'ይህ ከመሣሪያው ውስጥ ውሂብን በቋሚነት ያጠፋል።':'Permanently remove this device’s vault.')}</div></div><button class="button button-danger button-small" data-action="reset-vault">${icon('trash',14)}${esc(t('reset'))}</button></div></section></div>
  <p class="privacy-copy" style="margin-top:18px">${esc(lang()==='am'?'ጠቃሚ ማስታወሻ፦ የዚህ ስሪት ፋይሎች በHTTPS ማስተናገድ ይፈልጋሉ ለመጫን እና ከመጀመሪያው በኋላ ከመስመር ውጭ ለመስራት። የተመሰጠረ ውሂብ በአሳሹ ውስጥ ይቀመጣል። አሳሽ ውሂብን ካጠፋ ቅጂ ካልዎት ብቻ መመለስ ይቻላል።':'Note: The app must be served over HTTPS to install and cache offline. The encrypted vault remains in this browser profile. If browser storage is cleared, recovery requires a backup.')}</p>`;
}
function renderRoute() {
  if(state.route==='today') return renderToday();
  if(state.route==='capture') return renderCapture();
  if(state.route==='tasks') return renderTasks();
  if(state.route==='knowledge') return renderKnowledge();
  if(state.route==='review') return renderReview();
  if(state.route==='focus') return renderFocus();
  if(state.route==='settings') return renderSettings();
  state.route='today'; return renderToday();
}

function showLockScreen(message='',hasVault=false) {
  appRoot.innerHTML = `<div id="lock-screen"><section class="lock-card"><div class="lock-brand">${brand()}</div><div class="eyebrow">${esc(langFromVaultFallback())}</div><h1>${esc(hasVault?t('unlockTitle'):t('firstVaultTitle'))}</h1><p class="lock-desc">${esc(t('passphraseDesc'))}</p><form id="vault-form" data-vault-form="${hasVault?'unlock':'create'}" autocomplete="off"><div class="field"><label for="vault-passphrase">${esc(t('passphrase'))}</label><input id="vault-passphrase" type="password" name="passphrase" minlength="10" required autocomplete="current-password" placeholder="${esc(lang()==='am'?'ረጅም እና የሚታወስ ሐረግ':'Use a strong, memorable passphrase')}" autofocus></div>${hasVault?'':`<div class="field" style="margin-top:13px"><label for="vault-confirm">${esc(t('confirmPassphrase'))}</label><input id="vault-confirm" type="password" name="confirm" minlength="10" required autocomplete="new-password"></div>`}<div class="form-actions"><button type="submit" class="button button-primary" style="width:100%">${icon('lock')}${esc(hasVault?t('unlock'):t('createVault'))}</button></div>${message?`<div class="lock-error" role="alert">${esc(message)}</div>`:''}</form><div class="lock-warning">${icon('shield',14)} ${esc(t('passphraseWarning'))}</div><p class="lock-footer">${icon('shield',12)} ${esc(t('noNetwork'))}<br>${esc(lang()==='am'?'የአካባቢያዊ ማከማቻ · ከክላውድ ጋር ግንኙነት የለም':'Local vault · no cloud connection')}</p></section></div>`;
  const form=document.getElementById('vault-form');
  form?.addEventListener('submit',handleVaultSubmit);
}
function langFromVaultFallback(){return 'PRIVATE LOCAL VAULT';}
async function handleVaultSubmit(event) {
  event.preventDefault();
  const form=event.currentTarget, mode=form.dataset.vaultForm;
  const pass=form.elements.passphrase.value;
  if(pass.length<10) { showLockScreen(t('passphraseMin'),mode==='unlock'); return; }
  try {
    if(mode==='create') {
      if(pass!==form.elements.confirm.value) { showLockScreen(t('passMismatch'),false); return; }
      const salt=crypto.getRandomValues(new Uint8Array(16));
      const key=await deriveEncryptionKey(pass,salt);
      state.cryptoKey=key; state.vaultSalt=bytesToBase64(salt); state.data=createEmptyData();
      await persist();
      render(); toast(lang()==='am'?'የግል ቦታዎ ተፈጥሯል።':'Your private vault is ready.');
    } else {
      const envelope=await vaultGet(); if(!envelope) { showLockScreen('',false); return; }
      const opened=await decryptPayload(envelope,pass);
      state.data=opened.data; state.cryptoKey=opened.key; state.vaultSalt=opened.saltBase64;
      state.data.notes ||= []; state.data.tasks ||= []; state.data.sessions ||= []; state.data.reviews ||= []; state.data.settings ||= {language:'am',theme:'light'};
      render();
    }
    if(!tickHandle) tickHandle=setInterval(tick,1000);
  } catch(error) {
    console.error('Vault unlock/create failed', error?.name || 'Error');
    showLockScreen(t('badPassphrase'),mode==='unlock');
  }
}
function openModal(title,description,body,wide=false) {
  modalRoot.innerHTML=`<div class="modal-backdrop" data-action="backdrop-close"><section class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}" ${wide?'style="max-width:760px"':''}><div class="modal-head"><div><h2>${esc(title)}</h2>${description?`<p>${esc(description)}</p>`:''}</div><button class="modal-x" data-action="close-modal" aria-label="${esc(t('cancel'))}">${icon('close',16)}</button></div>${body}</section></div>`;
  modalRoot.querySelector('input:not([type=hidden]),textarea,select,button')?.focus({preventScroll:true});
}
function closeModal() { modalRoot.innerHTML=''; }
function openNoteView(id) {
  const note=state.data.notes.find(n=>n.id===id); if(!note)return;
  const linked=(note.links||[]).map(link=>state.data.notes.find(n=>n.id===link)).filter(Boolean);
  const backlinks=state.data.notes.filter(n=>(n.links||[]).includes(id));
  const tags=(note.tags||[]).map(tag=>`<span class="tag">#${esc(tag)}</span>`).join('');
  const links=linked.length?linked.map(n=>`<button class="link-button" style="text-align:left" data-action="view-note" data-id="${esc(n.id)}">${icon('file',13)} ${esc(n.title||t('newNote'))}</button>`).join(''):`<span class="privacy-copy">${esc(t('noLinkedNotes'))}</span>`;
  const backs=backlinks.length?backlinks.map(n=>`<button class="link-button" style="text-align:left" data-action="view-note" data-id="${esc(n.id)}">${icon('arrowLeft',13)} ${esc(n.title||t('newNote'))}</button>`).join(''):`<span class="privacy-copy">${esc(lang()==='am'?'ሌላ ማስታወሻ ወደዚህ አልጠቆመም።':'No notes link here yet.')}</span>`;
  openModal(note.title||t('newNote'),`${esc(displayEth((note.updatedAt||note.createdAt||new Date().toISOString()).slice(0,10)))} · ${esc((DICT[lang()][note.type]||note.type))}`,`<div class="stack"><div class="note-content">${esc(note.content||'')}</div>${tags?`<div class="tag-list">${tags}</div>`:''}<div class="small-divider"></div><div><h3>${esc(t('related'))}</h3><div class="stack" style="gap:7px;margin-top:9px">${links}</div></div><div><h3>${esc(t('backlinks'))}</h3><div class="stack" style="gap:7px;margin-top:9px">${backs}</div></div><div class="form-actions"><button class="button button-secondary" data-action="close-modal">${esc(t('cancel'))}</button><button class="button button-primary" data-action="edit-note" data-id="${esc(note.id)}">${icon('edit',14)}${esc(t('edit'))}</button></div></div>`,true);
}

function openNoteModal(id=null) {
  const note=id?state.data.notes.find(x=>x.id===id):null;
  const selected=new Set(note?.links||[]);
  const links=state.data.notes.filter(x=>x.id!==id).map(x=>`<label class="link-option"><input type="checkbox" name="links" value="${esc(x.id)}" ${selected.has(x.id)?'checked':''}> <span>${esc(x.title||t('newNote'))}</span></label>`).join('') || `<span class="field-help">${esc(t('noLinkedNotes'))}</span>`;
  const currentEth=ethFromKey(dateKey());
  const types=[['fleeting',t('fleeting')],['evergreen',t('evergreen')],['research',t('research')],['journal',t('journal')],['meeting',t('meeting')],['reference',t('reference')],['daily',t('daily')]];
  openModal(note?t('edit')+' · '+t('newNote'):t('newNote'),lang()==='am'?'ከሌሎች ማስታወሻዎች ጋር ሊገናኝ የሚችል የግል መዝገብ።':'A private note that can link to other notes.',`
    <form data-form="note" class="form-grid"><input type="hidden" name="id" value="${esc(note?.id||'')}">
    <div class="field full"><label for="note-title">${esc(t('noteTitle'))}</label><input id="note-title" name="title" required maxlength="160" value="${esc(note?.title||'')}" placeholder="${esc(t('titlePlaceholder'))}"></div>
    <div class="field"><label for="note-type">${esc(t('noteType'))}</label><select id="note-type" name="type">${types.map(([v,l])=>`<option value="${v}" ${(note?.type||'fleeting')===v?'selected':''}>${esc(l)}</option>`).join('')}</select></div>
    <div class="field"><label for="note-tags">${esc(t('tags'))}</label><input id="note-tags" name="tags" value="${esc((note?.tags||[]).join(', '))}" placeholder="${esc(lang()==='am'?'ጥናት, ሀሳብ, መጽሐፍ':'research, idea, book')}"><span class="field-help">${esc(t('tagsHelp'))}</span></div>
    <div class="field full"><label for="note-content">${esc(t('noteBody'))}</label><textarea id="note-content" name="content" rows="7" placeholder="${esc(t('notePlaceholder'))}">${esc(note?.content||'')}</textarea></div>
    <div class="field full"><label>${esc(t('relatedNotes'))}</label><div class="link-picker">${links}</div></div>
    <div class="field full"><label class="checkbox-line"><input type="checkbox" name="favorite" ${note?.favorite?'checked':''}> ${esc(t('favorite'))}</label></div>
    <div class="field full"><div class="form-actions"><button type="button" class="button button-secondary" data-action="close-modal">${esc(t('cancel'))}</button><button type="submit" class="button button-primary">${icon('check')}${esc(t('save'))}</button></div></div></form>`,true);
}
function openTaskModal(id=null) {
  const task=id?state.data.tasks.find(x=>x.id===id):null;
  const current=ethFromKey(task?.dueDate||dateKey());
  const months=lang()==='am'?ETH_MONTHS_AM:ETH_MONTHS_EN;
  const dueEth=task?.dueDate?ethFromKey(task.dueDate):null;
  openModal(task?t('edit')+' · '+t('tasks'):t('addTask'),lang()==='am'?'ተግባሩን አንድ ግልጽ እርምጃ አድርገው ይጻፉ።':'Describe one concrete next action.',`
    <form data-form="task" class="form-grid"><input type="hidden" name="id" value="${esc(task?.id||'')}">
    <div class="field full"><label for="task-title">${esc(t('taskTitle'))}</label><input id="task-title" name="title" required maxlength="180" value="${esc(task?.title||'')}" placeholder="${esc(t('taskPlaceholder'))}"></div>
    <div class="field full"><label for="task-details">${esc(t('details'))}</label><textarea id="task-details" name="details" rows="3" placeholder="${esc(lang()==='am'?'አማራጭ ማብራሪያ…':'Optional context…')}">${esc(task?.details||'')}</textarea></div>
    <div class="field"><label for="task-priority">${esc(t('priority'))}</label><select name="priority" id="task-priority">${[['high',t('high')],['medium',t('medium')],['low',t('low')]].map(([v,l])=>`<option value="${v}" ${(task?.priority||'medium')===v?'selected':''}>${esc(l)}</option>`).join('')}</select></div>
    <div class="field"><label for="task-project">${esc(t('project'))}</label><input id="task-project" name="project" maxlength="120" value="${esc(task?.project||'')}" placeholder="${esc(t('projectPlaceholder'))}"></div>
    <div class="field full"><label class="checkbox-line"><input type="checkbox" name="dueEnabled" ${task?.dueDate?'checked':''}> ${esc(t('setDueDate'))}</label><div class="field-help">${esc(lang()==='am'?'ቀኑ በኢትዮጵያ ዘመን ይመረጣል፤ በውስጥ ግን ትክክለኛው ቀን ይቀመጣል።':'Choose the due date using the Ethiopian calendar. The equivalent date is stored consistently.')}</div></div>
    <div class="field"><label for="due-year">${esc(lang()==='am'?'ዓመት':'Year')}</label><input id="due-year" name="dueYear" type="number" min="1" max="9999" value="${dueEth?.year||current.year}" ${task?.dueDate?'':'disabled'}></div>
    <div class="field"><label for="due-month">${esc(lang()==='am'?'ወር':'Month')}</label><select id="due-month" name="dueMonth" ${task?.dueDate?'':'disabled'}>${months.map((m,i)=>`<option value="${i+1}" ${(dueEth?.month||current.month)===i+1?'selected':''}>${i+1}. ${esc(m)}</option>`).join('')}</select></div>
    <div class="field"><label for="due-day">${esc(lang()==='am'?'ቀን':'Day')}</label><input id="due-day" name="dueDay" type="number" min="1" max="30" value="${dueEth?.day||current.day}" ${task?.dueDate?'':'disabled'}></div>
    <div class="field full"><div class="form-actions"><button type="button" class="button button-secondary" data-action="close-modal">${esc(t('cancel'))}</button><button type="submit" class="button button-primary">${icon('check')}${esc(t('save'))}</button></div></div></form>`,true);
  const dueToggle=modalRoot.querySelector('input[name="dueEnabled"]');
  dueToggle?.addEventListener('change',()=>{for(const el of ['due-year','due-month','due-day']){const input=modalRoot.querySelector(`#${el}`); input.disabled=!dueToggle.checked;}});
  const monthSelect=modalRoot.querySelector('#due-month'), dayInput=modalRoot.querySelector('#due-day'), yearInput=modalRoot.querySelector('#due-year');
  const validateDay=()=>{if(!dayInput||!yearInput||!monthSelect)return;let year=Number(yearInput.value)||1,month=Number(monthSelect.value)||1;const max=month===13?(isEthiopianLeapYear(year)?6:5):30;dayInput.max=String(max);if(Number(dayInput.value)>max)dayInput.value=String(max);};
  monthSelect?.addEventListener('change',validateDay); yearInput?.addEventListener('change',validateDay);
}
function getFormValues(form) { return Object.fromEntries(new FormData(form).entries()); }
async function handleFormSubmit(event) {
  const form=event.target.closest('form[data-form]'); if(!form)return;
  const kind=form.dataset.form; event.preventDefault();
  const fd=new FormData(form);
  if(kind==='note') {
    const id=String(fd.get('id')||''); const existing=state.data.notes.find(n=>n.id===id);
    const note={id:id||newId(),title:String(fd.get('title')||'').trim(),content:String(fd.get('content')||''),type:String(fd.get('type')||'fleeting'),tags:[...new Set(String(fd.get('tags')||'').split(',').map(x=>x.trim().replace(/^#/,'')).filter(Boolean))],links:fd.getAll('links').map(String),favorite:fd.get('favorite')==='on',createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
    if(existing) state.data.notes=state.data.notes.map(n=>n.id===id?note:n); else state.data.notes.unshift(note);
    await persist(); closeModal(); state.route='knowledge'; state.noteSearch=''; render(); toast(existing?t('saved'):t('noteCreated'));
  } else if(kind==='task') {
    const id=String(fd.get('id')||''); const existing=state.data.tasks.find(x=>x.id===id); let dueDate=null;
    if(fd.get('dueEnabled')==='on') {
      const y=Number(fd.get('dueYear')),m=Number(fd.get('dueMonth')),d=Number(fd.get('dueDay'));
      try { const g=ethiopianToGregorian(y,m,d); dueDate=`${g.year}-${String(g.month).padStart(2,'0')}-${String(g.day).padStart(2,'0')}`; }
      catch { toast(lang()==='am'?'የቀን መጠኑ ትክክል አይደለም።':'Invalid Ethiopian due date.'); return; }
    }
    const task={id:id||newId(),title:String(fd.get('title')||'').trim(),details:String(fd.get('details')||''),priority:String(fd.get('priority')||'medium'),project:String(fd.get('project')||'').trim(),dueDate,top3Date:existing?.top3Date||null,createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),completedAt:existing?.completedAt||null};
    if(existing)state.data.tasks=state.data.tasks.map(x=>x.id===id?task:x);else state.data.tasks.unshift(task);
    await persist();closeModal();state.route='tasks';state.taskSearch='';render();toast(existing?t('saved'):t('taskCreated'));
  } else if(kind==='review') {
    const date=dateKey(), previous=state.data.reviews.find(r=>r.date===date);
    const review={id:previous?.id||newId(),date,wentWell:String(fd.get('wentWell')||''),learned:String(fd.get('learned')||''),nextWeek:String(fd.get('nextWeek')||''),createdAt:previous?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
    if(previous)state.data.reviews=state.data.reviews.map(r=>r.date===date?review:r);else state.data.reviews.unshift(review);
    await persist();render();toast(t('reviewSaved'));
  } else if(kind==='import-backup') {
    const password=String(fd.get('backupPassphrase')||''); if(!state.lastBackupFile)return;
    try { const text=await state.lastBackupFile.text(); const envelope=JSON.parse(text); const restored=await decryptPayload(envelope,password); state.data=restored.data; await persist();state.lastBackupFile=null;closeModal();render();toast(t('importDone')); }
    catch(error){ console.error('Backup restore failed',error?.name||'Error'); const err=modalRoot.querySelector('.lock-error'); if(err)err.textContent=t('importError'); else toast(t('importError')); }
  }
}
function toggleTask(id) {
  const task=state.data.tasks.find(x=>x.id===id); if(!task)return;
  task.completedAt=task.completedAt?null:new Date().toISOString(); task.updatedAt=new Date().toISOString();
  if(task.completedAt && task.top3Date===dateKey()) task.top3Date=null;
  persist().then(render).catch(()=>toast('Could not save changes.'));
}
function toggleTop3(id) {
  const task=state.data.tasks.find(x=>x.id===id);if(!task)return;
  if(task.top3Date===dateKey()){task.top3Date=null;persist().then(()=>{render();toast(t('topRemoved'));});return;}
  if(topTasks().length>=3){toast(t('topLimit'));return;}
  task.top3Date=dateKey();task.updatedAt=new Date().toISOString();persist().then(()=>{render();toast(t('topAdded'));});
}
function startFocus() {
  if(state.data.currentFocus){state.route='focus';render();return;}
  const taskId=document.getElementById('focus-task-select')?.value||null;
  state.data.currentFocus={id:newId(),taskId:taskId||null,durationSeconds:state.focusPreset*60,startedAt:Date.now(),elapsedBeforePause:0,paused:false,startedIso:new Date().toISOString(),distractions:[]};
  persist().then(()=>{state.route='focus';render();});
}
function pauseFocus() {
  const f=state.data.currentFocus;if(!f||f.paused)return;
  f.elapsedBeforePause=sessionElapsed(f);f.paused=true;f.startedAt=null;f.pausedAt=Date.now();persist().then(render);
}
function resumeFocus() { const f=state.data.currentFocus;if(!f||!f.paused)return;f.paused=false;f.startedAt=Date.now();f.pausedAt=null;persist().then(render); }
async function finishFocus(completed=true) {
  const f=state.data.currentFocus;if(!f)return;
  const elapsed=Math.max(1,Math.round(sessionElapsed(f)));
  state.data.sessions.unshift({id:f.id,taskId:f.taskId||null,startedAt:f.startedIso||new Date(Date.now()-elapsed*1000).toISOString(),endAt:new Date().toISOString(),durationSeconds:elapsed,plannedSeconds:f.durationSeconds,completed,distractions:f.distractions||[],rating:null});
  state.data.currentFocus=null;
  await persist();state.route='focus';render();openModal(t('focusDone'),t('sessionSaved'),`<div class="stack"><p class="privacy-copy">${esc(lang()==='am'?'የትኩረት ጊዜ፦':'Focused time:')} <strong>${esc(formatMinutes(elapsed))}</strong></p><div class="field"><label for="session-rating">${esc(lang()==='am'?'ትኩረትዎን ከ1 እስከ 5 ይገምግሙ':'Rate this session from 1 to 5')}</label><select id="session-rating"><option value="">${esc(lang()==='am'?'አሁን አይደለም':'Skip for now')}</option><option value="1">1 · ${esc(lang()==='am'?'ከባድ':'Difficult')}</option><option value="2">2</option><option value="3">3 · ${esc(lang()==='am'?'መካከለኛ':'Okay')}</option><option value="4">4</option><option value="5">5 · ${esc(lang()==='am'?'በጣም ጥሩ':'Excellent')}</option></select></div><div class="field"><label for="session-reflection">${esc(lang()==='am'?'አንድ አጭር ማስታወሻ (አማራጭ)':'A brief reflection (optional)')}</label><textarea id="session-reflection" rows="3"></textarea></div><div class="form-actions"><button class="button button-primary" data-action="save-session-rating">${icon('check')}${esc(t('save'))}</button></div></div>`);
  state.lastFinishedSessionId=f.id;
}
function tick() {
  const f=state.data?.currentFocus; if(!f)return;
  const remaining=currentRemaining();
  const el=document.getElementById('timer-value'); if(el)el.textContent=timerDisplay(remaining);
  const ring=document.getElementById('timer-ring');if(ring)ring.style.setProperty('--progress',`${Math.min(360,(sessionElapsed(f)/f.durationSeconds)*360)}deg`);
  if(remaining<=0) finishFocus(true);
}
function exportBackup() {
  return vaultGet().then(envelope=>{
    if(!envelope)throw new Error('No vault');
    const blob=new Blob([JSON.stringify({...envelope,exportedAt:new Date().toISOString(),product:'Focus Companion'},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`focus-companion-encrypted-backup-${dateKey()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast(t('exportDone'));
  }).catch(()=>toast(lang()==='am'?'ቅጂ ማውጣት አልተቻለም።':'Could not export backup.'));
}
function askRestoreFile() { const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=()=>{const file=input.files?.[0];if(!file)return;state.lastBackupFile=file;openModal(t('importBackup'),lang()==='am'?'ቅጂውን ለመክፈት ሲፈጠር የተጠቀሙትን የደህንነት ሐረግ ያስገቡ።':'Enter the passphrase used when the backup was created.',`<form data-form="import-backup"><div class="field"><label for="backup-passphrase">${esc(t('passphrase'))}</label><input id="backup-passphrase" name="backupPassphrase" type="password" required autocomplete="current-password"></div><div class="form-actions"><button type="button" class="button button-secondary" data-action="close-modal">${esc(t('cancel'))}</button><button type="submit" class="button button-primary">${icon('upload')}${esc(t('importBackup'))}</button></div><div class="lock-error" role="alert"></div></form>`);};input.click(); }
function showInstallHelp() {
  if(state.deferredInstallPrompt){state.deferredInstallPrompt.prompt();state.deferredInstallPrompt.userChoice.finally(()=>state.deferredInstallPrompt=null);return;}
  openModal(t('installTitle'),lang()==='am'?'በHTTPS አድራሻ ላይ ከተከፈተ በኋላ ወደ መነሻ ማያ ገጽ ማስገባት ይቻላል።':'The app needs a secure HTTPS address before it can be installed.',`<div class="stack"><div class="card card-flat"><h3>iPhone / iPad</h3><p class="privacy-copy" style="margin-top:8px">${esc(t('installIos'))}</p></div><div class="card card-flat"><h3>Android</h3><p class="privacy-copy" style="margin-top:8px">${esc(t('installAndroid'))}</p></div><div class="card card-flat"><h3>Windows / macOS / Linux</h3><p class="privacy-copy" style="margin-top:8px">${esc(t('installDesktop'))}</p></div><div class="lock-warning">${esc(lang()==='am'?'ይህ ስሪት በመጀመሪያ ማስተናገድ እና መጀመሪያ መክፈት ይፈልጋል። ከዚያ በኋላ የመተግበሪያው ፋይሎች ተከማችተው ከመስመር ውጭ ሊሰሩ ይችላሉ።':'Host over HTTPS and open it once online so the app shell is cached. After that, the cached application can open offline.')}</div></div>`);
}
async function shareApp() {
  const url=location.href;
  if(navigator.share) { try { await navigator.share({title:APP_NAME,text:'Focus Companion: a private personal knowledge and action app.',url}); } catch(error) { if(error.name!=='AbortError')toast(lang()==='am'?'ማጋራት አልተቻለም።':'Could not share.'); } }
  else if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(url);toast(lang()==='am'?'የመተግበሪያ አድራሻ ተቀድቷል።':'App address copied.');}catch{showInstallHelp();}}
  else showInstallHelp();
}
function lockNow() { state.data=null;state.cryptoKey=null;state.vaultSalt=null;closeModal();vaultGet().then(envelope=>showLockScreen('',!!envelope)); }
function toggleLanguage() { state.data.settings.language=lang()==='am'?'en':'am';persist().then(render); }
function toggleTheme() { state.data.settings.theme=state.data.settings.theme==='dark'?'light':'dark';persist().then(render); }

appRoot.addEventListener('click', async event=>{
  const routeButton=event.target.closest('[data-route]');
  if(routeButton){state.route=routeButton.dataset.route;render();return;}
  const actionButton=event.target.closest('[data-action]'); if(!actionButton)return;
  const action=actionButton.dataset.action, id=actionButton.dataset.id;
  if(action==='close-modal'){closeModal();return;}
  if(action==='add-note'){openNoteModal();return;}
  if(action==='add-task'){openTaskModal();return;}
  if(action==='view-note'){openNoteView(id);return;}
  if(action==='edit-note'){closeModal();openNoteModal(id);return;}
  if(action==='delete-note'){
    if(!confirm(t('confirmDeleteNote')))return;
    state.data.notes=state.data.notes.filter(n=>n.id!==id);
    state.data.notes.forEach(n=>n.links=(n.links||[]).filter(link=>link!==id));
    await persist();render();toast(t('noteDeleted'));return;
  }
  if(action==='edit-task'){openTaskModal(id);return;}
  if(action==='toggle-task'){toggleTask(id);return;}
  if(action==='toggle-top3'){toggleTop3(id);return;}
  if(action==='task-filter'){state.taskFilter=actionButton.dataset.filter;render();return;}
  if(action==='toggle-favorite'){
    const note=state.data.notes.find(n=>n.id===id);if(note){note.favorite=!note.favorite;note.updatedAt=new Date().toISOString();await persist();render();}return;
  }
  if(action==='toggle-language'){toggleLanguage();return;}
  if(action==='toggle-theme'){toggleTheme();return;}
  if(action==='lock-now'){lockNow();return;}
  if(action==='install-help'){showInstallHelp();return;}
  if(action==='share-app'){shareApp();return;}
  if(action==='export-backup'){exportBackup();return;}
  if(action==='import-backup'){askRestoreFile();return;}
  if(action==='reset-vault'){
    if(!confirm(t('confirmReset')))return;
    await vaultDelete();state.data=null;state.cryptoKey=null;state.vaultSalt=null;closeModal();showLockScreen('',false);return;
  }
  if(action==='select-preset'){state.focusPreset=Number(actionButton.dataset.minutes)||25;render();return;}
  if(action==='begin-focus'){startFocus();return;}
  if(action==='continue-focus'){state.route='focus';render();return;}
  if(action==='pause-focus'){pauseFocus();return;}
  if(action==='resume-focus'){resumeFocus();return;}
  if(action==='finish-focus'){finishFocus(false);return;}
  if(action==='log-distraction'){
    const input=document.getElementById('distraction-input'),text=input?.value.trim();if(!text)return;
    state.data.currentFocus.distractions ||= [];state.data.currentFocus.distractions.push({text,at:new Date().toISOString()});await persist();input.value='';toast(lang()==='am'?'ተመዝግቧል። ወደ ስራው ይመለሱ።':'Logged. Return to your work.');return;
  }
  if(action==='save-session-rating'){
    const rating=Number(document.getElementById('session-rating')?.value)||null;
    const reflection=document.getElementById('session-reflection')?.value||'';
    const session=state.data.sessions.find(s=>s.id===state.lastFinishedSessionId);if(session){session.rating=rating;session.reflection=reflection;await persist();}closeModal();render();toast(t('sessionSaved'));return;
  }
});

modalRoot.addEventListener('click',async event=>{
  if(event.target.classList.contains('modal-backdrop')&&event.target.dataset.action==='backdrop-close'){closeModal();return;}
  const button=event.target.closest('[data-action]'); if(!button)return;
  const action=button.dataset.action, id=button.dataset.id;
  if(action==='close-modal'){closeModal();return;}
  if(action==='view-note'){openNoteView(id);return;}
  if(action==='edit-note'){closeModal();openNoteModal(id);return;}
  if(action==='save-session-rating'){
    const rating=Number(document.getElementById('session-rating')?.value)||null;
    const reflection=document.getElementById('session-reflection')?.value||'';
    const session=state.data.sessions.find(s=>s.id===state.lastFinishedSessionId);
    if(session){session.rating=rating;session.reflection=reflection;await persist();}
    closeModal();render();toast(t('sessionSaved'));return;
  }
});
document.addEventListener('submit',handleFormSubmit);
document.addEventListener('input',event=>{
  const input=event.target;
  if(input.dataset.search==='notes') {
    state.noteSearch=input.value; const cursor=input.selectionStart; render(); const next=document.getElementById('note-search');next?.focus();try{next?.setSelectionRange(cursor,cursor);}catch{};
  } else if(input.dataset.search==='tasks') {
    state.taskSearch=input.value; const cursor=input.selectionStart;render();const next=document.getElementById('task-search');next?.focus();try{next?.setSelectionRange(cursor,cursor);}catch{};
  }
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&modalRoot.innerHTML)closeModal();
  if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k') {event.preventDefault(); if(!state.data)return; if(state.route!=='knowledge'){state.route='knowledge';render();} document.getElementById('note-search')?.focus();}
  if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='n') {event.preventDefault();if(state.data)openNoteModal();}
});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();state.deferredInstallPrompt=event;});
window.addEventListener('online',()=>{if(state.data)toast(lang()==='am'?'ትግበራው ተከፍቷል። ነገር ግን ውሂብዎ በዚህ መሣሪያ ላይ ነው።':'You are online. Your records remain on this device.');});

async function boot() {
  if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')) {
    navigator.serviceWorker.register('./sw.js').catch(error=>console.warn('Offline shell could not register:',error?.name||'Error'));
  }
  if(!isSecureCryptoAvailable()) { showLockScreen(t('secureContext'),false); return; }
  try { const envelope=await vaultGet(); showLockScreen('',!!envelope); }
  catch(error) { console.error('Vault initialization failed',error?.name||'Error'); showLockScreen(lang()==='am'?'የአካባቢያዊ ማከማቻ ሊከፈት አልቻለም።':'Could not access local browser storage.',false); }
  if(!tickHandle)tickHandle=setInterval(tick,1000);
}
boot();
