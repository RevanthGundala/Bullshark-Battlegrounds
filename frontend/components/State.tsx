interface StateProps {
    isWaitingForDiscard: boolean;
    isWaitingForAttack: boolean;
    isWaitingForPlay: boolean;
  }
  
  const State: React.FC<StateProps> = ({ isWaitingForDiscard, isWaitingForAttack, isWaitingForPlay }) => {
    return (
      <div>
        {isWaitingForDiscard ? (
          <h1>Waiting for discard</h1>
        ) : (
          <>
            {isWaitingForPlay ? (
              <h1>Waiting for play</h1>
            ) : (
              <>
                {isWaitingForAttack ? (
                  <h1>Waiting for Attack</h1>
                ) : <h1>Waiting for game...</h1>}
              </>
            )}
          </>
        )}
      </div>
    );
  };
  
  export default State;