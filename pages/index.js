import { useState, useEffect } from 'react'
import styles from '../styles/Uno.module.css'

const COLORS = ['red', 'blue', 'green', 'yellow']
const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
const ACTIONS = ['skip', 'reverse', '+2']
const WILDS = ['wild', 'wild+4']

function createDeck() {
  const deck = []

  COLORS.forEach(color => {
    deck.push({ color, value: '0', id: `${color}-0` })
    NUMBERS.slice(1).forEach(num => {
      deck.push({ color, value: num, id: `${color}-${num}-1` })
      deck.push({ color, value: num, id: `${color}-${num}-2` })
    })
    ACTIONS.forEach(action => {
      deck.push({ color, value: action, id: `${color}-${action}-1` })
      deck.push({ color, value: action, id: `${color}-${action}-2` })
    })
  })

  for (let i = 0; i < 4; i++) {
    deck.push({ color: 'black', value: 'wild', id: `wild-${i}` })
    deck.push({ color: 'black', value: 'wild+4', id: `wild+4-${i}` })
  }

  return shuffleDeck(deck)
}

function shuffleDeck(deck) {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function UnoGame() {
  const [deck, setDeck] = useState([])
  const [playerHand, setPlayerHand] = useState([])
  const [computerHand, setComputerHand] = useState([])
  const [discardPile, setDiscardPile] = useState([])
  const [currentPlayer, setCurrentPlayer] = useState('player')
  const [direction, setDirection] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [message, setMessage] = useState('')
  const [selectingColor, setSelectingColor] = useState(false)
  const [pendingWildCard, setPendingWildCard] = useState(null)
  const [unoWarning, setUnoWarning] = useState(false)
  const [hasCalledUno, setHasCalledUno] = useState(false)

  useEffect(() => {
    startNewGame()
  }, [])

  useEffect(() => {
    if (currentPlayer === 'computer' && !gameOver && !selectingColor) {
      setTimeout(() => {
        computerPlay()
      }, 1500)
    }
  }, [currentPlayer, gameOver, selectingColor])

  const startNewGame = () => {
    const newDeck = createDeck()
    const player = newDeck.splice(0, 7)
    const computer = newDeck.splice(0, 7)

    let firstCard = newDeck.pop()
    while (firstCard.value.includes('wild') || firstCard.value.includes('+')) {
      newDeck.unshift(firstCard)
      firstCard = newDeck.pop()
    }

    setDeck(newDeck)
    setPlayerHand(player)
    setComputerHand(computer)
    setDiscardPile([firstCard])
    setCurrentPlayer('player')
    setDirection(1)
    setGameOver(false)
    setWinner(null)
    setMessage('لعبة أونو - ابدأ اللعب!')
    setSelectingColor(false)
    setPendingWildCard(null)
    setHasCalledUno(false)
  }

  const canPlayCard = (card, topCard) => {
    if (card.value === 'wild' || card.value === 'wild+4') return true
    if (card.color === topCard.color) return true
    if (card.value === topCard.value) return true
    return false
  }

  const handleColorSelection = (selectedColor) => {
    const newCard = { ...pendingWildCard, color: selectedColor }
    const newDiscardPile = [...discardPile, newCard]
    setDiscardPile(newDiscardPile)
    setSelectingColor(false)
    setPendingWildCard(null)

    if (newCard.value === 'wild+4') {
      drawCards(currentPlayer === 'player' ? 'computer' : 'player', 4)
      setMessage(`${currentPlayer === 'player' ? 'الكمبيوتر' : 'أنت'} سحب 4 أوراق!`)
    }

    switchTurn()
  }

  const playCard = (card, isPlayer = true) => {
    const topCard = discardPile[discardPile.length - 1]

    if (!canPlayCard(card, topCard)) {
      if (isPlayer) setMessage('لا يمكن لعب هذه البطاقة!')
      return false
    }

    if (isPlayer) {
      setPlayerHand(prev => prev.filter(c => c.id !== card.id))

      if (playerHand.length === 2 && !hasCalledUno) {
        setUnoWarning(true)
        setTimeout(() => setUnoWarning(false), 2000)
      }

      if (playerHand.length === 1) {
        setWinner('player')
        setGameOver(true)
        setMessage('مبروك! لقد فزت!')
        return true
      }
    } else {
      setComputerHand(prev => prev.filter(c => c.id !== card.id))

      if (computerHand.length === 2) {
        setMessage('أونو! - الكمبيوتر')
      }

      if (computerHand.length === 1) {
        setWinner('computer')
        setGameOver(true)
        setMessage('الكمبيوتر فاز!')
        return true
      }
    }

    if (card.value === 'wild' || card.value === 'wild+4') {
      setSelectingColor(true)
      setPendingWildCard(card)
      if (isPlayer) {
        setMessage('اختر اللون')
      }
      return true
    }

    setDiscardPile(prev => [...prev, card])

    if (card.value === 'skip') {
      setMessage(`تم تخطي ${isPlayer ? 'الكمبيوتر' : 'دورك'}!`)
      setTimeout(() => switchTurn(), 500)
      setTimeout(() => switchTurn(), 1000)
    } else if (card.value === 'reverse') {
      setDirection(prev => -prev)
      setMessage('تم عكس الاتجاه!')
      switchTurn()
    } else if (card.value === '+2') {
      const target = isPlayer ? 'computer' : 'player'
      drawCards(target, 2)
      setMessage(`${isPlayer ? 'الكمبيوتر' : 'أنت'} سحب ورقتين!`)
      switchTurn()
    } else {
      switchTurn()
    }

    return true
  }

  const drawCards = (player, count = 1) => {
    if (deck.length < count) {
      const newDeck = shuffleDeck([...discardPile.slice(0, -1)])
      setDeck(newDeck)
      setDiscardPile([discardPile[discardPile.length - 1]])
    }

    const drawnCards = deck.slice(0, count)
    setDeck(prev => prev.slice(count))

    if (player === 'player') {
      setPlayerHand(prev => [...prev, ...drawnCards])
    } else {
      setComputerHand(prev => [...prev, ...drawnCards])
    }
  }

  const handleDrawCard = () => {
    if (currentPlayer !== 'player' || gameOver || selectingColor) return

    drawCards('player', 1)
    setMessage('سحبت ورقة - الآن دور الكمبيوتر')
    switchTurn()
  }

  const switchTurn = () => {
    setCurrentPlayer(prev => prev === 'player' ? 'computer' : 'player')
  }

  const computerPlay = () => {
    const topCard = discardPile[discardPile.length - 1]
    const playableCards = computerHand.filter(card => canPlayCard(card, topCard))

    if (playableCards.length > 0) {
      const cardToPlay = playableCards[0]

      if (cardToPlay.value === 'wild' || cardToPlay.value === 'wild+4') {
        setComputerHand(prev => prev.filter(c => c.id !== cardToPlay.id))

        const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 }
        computerHand.forEach(card => {
          if (card.color !== 'black') colorCounts[card.color]++
        })

        const selectedColor = Object.keys(colorCounts).reduce((a, b) =>
          colorCounts[a] > colorCounts[b] ? a : b
        )

        setPendingWildCard(cardToPlay)
        setSelectingColor(true)
        setTimeout(() => handleColorSelection(selectedColor), 1000)
      } else {
        playCard(cardToPlay, false)
      }
    } else {
      drawCards('computer', 1)
      setMessage('الكمبيوتر سحب ورقة')
      setTimeout(() => switchTurn(), 1000)
    }
  }

  const callUno = () => {
    setHasCalledUno(true)
    setMessage('أونو!')
    setTimeout(() => setMessage(''), 1500)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🎮 لعبة أونو 🎮</h1>
        <button onClick={startNewGame} className={styles.newGameBtn}>
          لعبة جديدة
        </button>
      </div>

      {message && (
        <div className={`${styles.message} ${unoWarning ? styles.unoWarning : ''}`}>
          {message}
        </div>
      )}

      {gameOver && (
        <div className={styles.gameOver}>
          <h2>{winner === 'player' ? '🎉 أنت الفائز! 🎉' : '💻 الكمبيوتر فاز 💻'}</h2>
        </div>
      )}

      <div className={styles.computerSection}>
        <div className={styles.playerInfo}>
          <h3>الكمبيوتر</h3>
          <span className={styles.cardCount}>{computerHand.length} أوراق</span>
        </div>
        <div className={styles.computerHand}>
          {computerHand.map((_, index) => (
            <div key={index} className={styles.cardBack} style={{ left: `${index * 15}px` }}>
              ?
            </div>
          ))}
        </div>
      </div>

      <div className={styles.playArea}>
        <div className={styles.deckArea}>
          <div className={styles.deck} onClick={handleDrawCard}>
            <div className={styles.cardBack}>سحب</div>
            <span className={styles.deckCount}>{deck.length}</span>
          </div>

          <div className={styles.discardPile}>
            {discardPile.length > 0 && (
              <div className={`${styles.card} ${styles[discardPile[discardPile.length - 1].color]}`}>
                <span className={styles.cardValue}>{discardPile[discardPile.length - 1].value}</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.turnIndicator}>
          {currentPlayer === 'player' ? '👇 دورك' : '⏳ دور الكمبيوتر'}
        </div>
      </div>

      {selectingColor && currentPlayer === 'player' && (
        <div className={styles.colorSelector}>
          <h3>اختر اللون:</h3>
          <div className={styles.colorOptions}>
            {COLORS.map(color => (
              <button
                key={color}
                className={`${styles.colorButton} ${styles[color]}`}
                onClick={() => handleColorSelection(color)}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.playerSection}>
        <div className={styles.playerInfo}>
          <h3>أنت</h3>
          <span className={styles.cardCount}>{playerHand.length} أوراق</span>
          {playerHand.length === 2 && !hasCalledUno && (
            <button onClick={callUno} className={styles.unoButton}>
              قل أونو!
            </button>
          )}
        </div>
        <div className={styles.playerHand}>
          {playerHand.map((card, index) => (
            <div
              key={card.id}
              className={`${styles.card} ${styles[card.color]} ${
                currentPlayer === 'player' && canPlayCard(card, discardPile[discardPile.length - 1])
                  ? styles.playable
                  : ''
              }`}
              onClick={() => currentPlayer === 'player' && !selectingColor && playCard(card, true)}
              style={{ transform: `translateY(${index % 2 === 0 ? -10 : 0}px)` }}
            >
              <span className={styles.cardValue}>{card.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
