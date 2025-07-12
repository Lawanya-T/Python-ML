#rock paper scissor game

import random
str=input("Do you want to play ? yes or no:")
def game():
    player = input("What is your move? 'r' for rock, 's' for scissor, 'p' for paper\n")
    bot = random.choice(['r','p','c'])
    print(bot)
    if player == bot:
        return 'Its a tie!!'
    if win(player,bot):
        return 'You win!!'
    return 'you lost'
def win(p1, pc):
    if (p1 == 'r' and pc == 's' ) or (p1 == 's' and pc == 'p') or (p1 == 'p' and pc == 'r'):
        return True
while str == "yes":
    str=input("Do you want to play ? yes or no:")
    
    if str == "no":
        break;
    print(game())