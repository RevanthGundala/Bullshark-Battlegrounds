<Button 
            colorScheme='yellow' isLoading={isLoading} onClick={() => 
              end_turn(wallet, router.query.game_id as string)} 
              disabled={isDisabled}>
                End Turn
            </Button>
            <Box>
              {deckSize > 0 ? (
                <Box>
                 <Image src="/images/cards/back.jpeg" 
                 alt="card-back" 
                 height="200px"/>
                 {/* <Image src="/images/cards/front.png"
                 alt="card-front"
                 height="150px"
                 width={"100px"}/> */}
                 <Image src="/images/cards/back.jpeg" 
                 alt="card-back" 
                 height="200px"/>
                 </Box>
              ) : (
                <Box>
                  {/* render nothing */}
                </Box>
              )}
            </Box>


<Button colorScheme="red" isLoading={isLoading} 
            onClick={() => {
              surrender(wallet, router.query.game_id as string);
              router.push("/");
            }}>
                Surrender
            </Button>


<Box
        bgImage="url('/images/map.png')"
        bgPosition="center"
        bgRepeat="no-repeat"
        bgSize="cover"
        minH="100vh"
        ></Box>