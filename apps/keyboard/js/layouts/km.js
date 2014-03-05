Keyboards.km = {
  label: 'Khmer',
  imEngine: 'latin',
  types: ['text', 'url', 'email'],
  autoCorrectLanguage: 'km',
  menuLabel: 'ខ្មែរ',
  alt: {
    ដ: '១ឧ',
    ន: '២ឪ',
    ប: '៣៍',
    អ: '៤ឍ',
    ត: '៥៉',
    ព: '៦ឹ',
    ច: '៧ឺ',
    វ: '៨័',
    ទ: '៩',
    ណ: '០៛',
    ឬ: 'ឫ',
    ខ: '៏',
    ក: '៌',
    ៗ: 'ឋ',
    ល: 'ិ',
    ម: 'ំ',
    ្: '៎',
    រ: 'ឌ',
    ញ: 'ោ',
    ឯ: 'ឈ',
    ស: '។',
    ហ: '៕',
    ង: 'ឲ',
    គ: 'ឳ',
    ជ: 'ឿ',
    យ: 'ៀ',
  },
  upperCase: {
    ដ: 'ឱ',
    ន: 'ុ',
    ប: 'ូ',
    អ: 'ួ',
    ត: 'ថ',
    ព: 'ភ',
    ច: 'ឆ',
    វ: 'ឦ',
    ទ: 'ធ',
    ណ: 'ី',
    ឬ: '៊',
    ខ: '់',
    ក: 'ះ',
    ៗ: 'ៈ',
    ល: 'ឡ',
    ម: 'ឮ',
    ្: 'ឭ',
    រ: 'ា',
    ញ: 'ៅ',
    ឯ: 'ឥ',
    ស: 'ើ',
    ហ: 'ៃ',
    ង: 'ឃ',
    គ: 'ផ',
    ជ: 'េ',
    យ: 'ែ',
 },
  keys: [
    [
      { value: 'ដ' }, { value: 'ន' }, { value: 'ប' } , { value: 'អ' },
      { value: 'ត' } , { value: 'ព' }, { value: 'ច' } , { value: 'វ' },
      { value: 'ទ' }, { value: 'ណ' }
    ], [
      { value: 'ឬ' }, { value: 'ខ' }, { value: 'ក' }, { value: 'ៗ' },
      { value: 'ល' } , { value: 'ម' }, { value: '្' }, { value: 'រ' },
      { value: 'ញ' },
      { value: ':', visible: ['url']}, { value: '_', visible: ['email']}
    ], [
      { value: '⇪', ratio: 1.5, keyCode: KeyEvent.DOM_VK_CAPS_LOCK },
      { value: 'ឯ' }, { value: 'ស' }, { value: 'ហ' }, { value: 'ង' },
      { value: 'គ' }, { value: 'ជ' }, { value: 'យ' },
      { value: '⌫', ratio: 1.5, keyCode: KeyEvent.DOM_VK_BACK_SPACE }
    ], [
      { value: '&nbsp', ratio: 8, keyCode: KeyboardEvent.DOM_VK_SPACE },
      { value: '↵', ratio: 2, keyCode: KeyEvent.DOM_VK_RETURN }
    ]
  ],
  alternateLayout: {
    alt: {
      '0': 'º',
      '1': '1st ',
      '2': '2nd ',
      '3': '3rd ',
      '4': '4th ',
      '5': '5th ',
      '6': '6th ',
      '7': '7th ',
      '8': '8th ',
      '9': '9th ',
      '$': '៛€ £ ¥',
      '?': '¿',
      '!': '¡'
    },
    keys: [
      [
        { value: '1' }, { value: '2' }, { value: '3' } , { value: '4' },
        { value: '5' } , { value: '6' }, { value: '7' } , { value: '8' },
        { value: '9' }, { value: '0' }
      ], [
        { value: '@', hidden: ['email'] }, { value: '#' }, { value: '$' },
        { value: '%' }, { value: '&' } , { value: '*' }, { value: '-' },
        { value: '+' }, { value: '(' }, { value: ')' },
        { value: '_', visible: ['email'] }
      ], [
        { value: 'ALT', ratio: 1.5, keyCode: KeyEvent.DOM_VK_ALT },
        { value: '!' }, { value: '\"' }, { value: "'" }, { value: ':' },
        { value: ';' }, { value: '/' }, { value: '?' },
        { value: '⌫', ratio: 1.5, keyCode: KeyEvent.DOM_VK_BACK_SPACE }
      ], [
        { value: '&nbsp', ratio: 8, keyCode: KeyboardEvent.DOM_VK_SPACE },
        { value: '↵', ratio: 2, keyCode: KeyEvent.DOM_VK_RETURN }
      ]
    ]
  }
};
