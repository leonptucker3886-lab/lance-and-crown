// The story, kept as data so the engine stays testable and the prose stays in
// one place. Canon follows joustline/docs: the squire of Montresor, Lord Bart
// Sheen, Tancrede, the Baron of Vaudrecourt and his ledger.
//
// House rules from those notes:
//  - comedy and tragedy in the same breath, puns never explained;
//  - no narrator explains a reference, a backstory or a twist;
//  - Lord Bart Sheen is never named as anything other than Lord Bart Sheen.

export const PROLOGUE = [
  {
    kicker: 'Montresor, 1515',
    title: 'The boy who held the horse',
    text:
      'A coaching inn burned on the Loire road six winters ago. Everyone ran. A soaked knight on the wrong road found the only one who did not: a boy with both hands on a panicking bridle, waiting for the smoke to decide.',
  },
  {
    kicker: 'Montresor',
    title: 'Won at dice',
    text:
      'Lord Bart Sheen tells the court he won the boy at dice. He tells it louder the more he drinks. Nobody asks why he bought the horse the next morning with money he did not have.',
  },
  {
    kicker: 'Chapter One',
    title: 'The squire',
    text:
      'You are sixteen. You hand up lances, tighten straps, rub the knot out of a knight\u2019s leg before a crowd, and keep Tancrede from biting the steward. Bart wins. Bart takes the credit. You keep the horse calm.',
  },
  {
    kicker: 'Chapter One',
    title: 'The lists are open',
    text:
      'Six riders stand between this house and its honour. Put them in the sand and the court will have to learn your name \u2014 not his.',
  },
];

export const STORY = {
  sorel: {
    intro: [
      {
        kicker: 'I',
        title: 'Guillaume Sorel',
        text:
          'Champion of the Montresor fair three years running, and the loudest man in the shire. He has never been unhorsed. He has also never ridden anyone who was not already drunk.',
      },
      {
        kicker: 'I',
        title: 'The goblet',
        text:
          '\u201cA farmer with a long stick,\u201d says Bart, from behind a goblet he was told not to bring to the lists. He has a fresh excuse ready and it is not yet noon.',
      },
    ],
    win:
      'Sorel goes over the barrier backwards and lands sitting up, still complaining. The fair learns a new name before Bart can finish saying it was his idea.',
    loss:
      'Sorel takes the purse and the story. Bart takes another drink and tells the tent it was the sun in his goblet.',
  },

  isabeau: {
    intro: [
      {
        kicker: 'II',
        title: 'Isabeau de Loches',
        text:
          'A rival squire with a lance of her own and better boots than yours. She has been taking circuit purses since she was fourteen, while you were holding somebody else\u2019s bridle.',
      },
      {
        kicker: 'II',
        title: 'A reason',
        text:
          '\u201cThey gave you a horse,\u201d she says, eyeing Tancrede. \u201cDid they give you a reason?\u201d',
      },
    ],
    win:
      'She picks herself up, spits sand, and grins at you with nothing actually lost. \u201cAgain. Next fair. Same terms.\u201d Something that will keep you alive for years starts here.',
    loss:
      'Isabeau puts you in the dirt with the calm of someone doing arithmetic. \u201cCome back when your knight is not the one drinking,\u201d she says, and means it kindly.',
  },

  bonnivet: {
    intro: [
      {
        kicker: 'III',
        title: 'Bonnivet',
        text:
          'The admiral keeps riders the way a man keeps hawks: hooded, expensive, and pointed at whatever he wants taken. He has heard Bayard speak well of you, which is exactly why he wants you broken.',
      },
      {
        kicker: 'III',
        title: 'A small book',
        text:
          '\u201cSentiment is a poor shield,\u201d he says, and does not raise his hand to the stands.',
      },
    ],
    win:
      'The admiral\u2019s rider is down and the admiral is already looking past you at the next name on his list. Court men remember who beat them. That is worth more than the purse.',
    loss:
      'Bonnivet does not gloat. He writes something in a small book instead, and you have been entered in it, which is worse than being shouted at.',
  },

  brandon: {
    intro: [
      {
        kicker: 'IV',
        title: 'Charles Brandon',
        text:
          'The English have come with pavilions of silk and a duke who jousts like a war. He looks at your horse, then at you, and decides you are a boy in borrowed steel.',
      },
      {
        kicker: 'IV',
        title: 'A sketchbook',
        text:
          '\u201cThey send me a squire,\u201d he says. Behind him a lanky man with a sketchbook is drawing everyone in the stands with enormous overbites.',
      },
    ],
    win:
      'Brandon comes off at the second pass and laughs about it, which is somehow worse than if he had not. He offers you his hand. The man with the sketchbook draws you with a slingshot.',
    loss:
      'Brandon unhorses you politely and helps you up. Old Gaspard, narrating, gets the year wrong, and Bayard corrects him from three tents away.',
  },

  bourbon: {
    intro: [
      {
        kicker: 'V',
        title: 'The Duke of Bourbon',
        text:
          'A colour that changes hands. He rides in a field he chose, for men who pay in promises, and he offers the one thing nobody else will: a future that is not the Baron\u2019s.',
      },
      {
        kicker: 'V',
        title: 'A luxury',
        text:
          '\u201cLoyalty is a luxury of the well-fed,\u201d he says. \u201cAsk your cousin what he has eaten lately.\u201d He does not say whose cousin, and does not need to.',
      },
    ],
    win:
      'The duke\u2019s banner goes down and the field goes quiet. Somewhere behind you the Baron is already working out how to sell this.',
    loss:
      'Bourbon unhorses you and rides on without looking back. A servant hands you a letter you cannot place, sealed with a stamp you will see again on every page of a ledger.',
  },

  bart: {
    intro: [
      {
        kicker: 'VI',
        title: 'Lord Bart Sheen',
        text:
          'Bart comes back. The leg is healed \u2014 no knot, no cramp, no excuse waiting at the end of the list. He is the best jouster in France now, and he raises a goblet to you before the charge.',
      },
      {
        kicker: 'VI',
        title: 'WINNING!',
        text:
          '\u201cMy boy!\u201d he calls across the barrier, cheerful as a man who has forgotten who paid for the surgery. Then someone else\u2019s colours go over his shoulders, and the stands go quiet.',
      },
    ],
    win:
      'The best jouster in France sits in the sand and laughs like it is a joke he has been saving. Then he stops laughing, and does not look at the stands. You still do not know what he was traded for.',
    loss:
      'Bart wins, and toasts you in front of the court, and somehow that is worse than losing.',
  },
};

/** The end of Chapter One. Shown on the champion screen. */
export const FINALE = {
  kicker: 'Chapter One',
  title: 'The First Crown',
  text:
    'Every knight in the realm has heard a squire\u2019s name. The Baron\u2019s ledger is still open on the table, \u201cSurgeons, Paris: paid\u201d written in a neat hand, and the next line is not finished yet.',
};
