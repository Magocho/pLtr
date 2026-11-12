// Pequeno programa para calcular através de bit a matriz de palavras 5x5;
#include<stdio.h>
#include<stdint.h>
#include<stdbool.h>
#include<string.h>

// REFERÊNCIAS 
// (Obs. Não segue padrão, é por ordem de menção).
// [1] (lin 41) https://stackoverflow.com/questions/12380478/bits-counting-algorithm-brian-kernighan-in-an-integer-time-complexity 

#define SUCESSO    -1  // Meio esquisito, mas tem um motivo.
#define FIM         0  // ok!
#define QUANT_L     5
#define QUANT_L_C   6
#define ABC        26
#define TOTAL_P  6301  // Obs. Meu arquivo de palavra possui tudo isso!
#define TAM_BIT    99

char palavras[TOTAL_P][QUANT_L_C];

// 6301 / 64 = 98... -> 99 
// 26 quant. a - z
// 5 _ _ _ _ _
uint64_t index_bit[QUANT_L][ABC][TAM_BIT];

typedef struct {
  uint64_t bits[TAM_BIT];  // Uhm, talvez deveria ter feito um define...
} bitmap;

typedef struct {
  bitmap lin[QUANT_L];
  bitmap col[QUANT_L];
  char mtrx[QUANT_L][QUANT_L_C];
} matrix;

typedef struct {
  matrix m;
  bool lin_atual[QUANT_L];  // Poderia ter feito com bit...
  bool col_atual[QUANT_L];  // Mas como tem muito, prefiro evitar mais.
} std_busca;


int count_set_bits(bitmap *n);     // [1] func auxiliar (algoritmo de Kernighan adaptado para bitmap)
void add_index(char *s, int id);   // func auxiliar de criar_index()
int criar_index(char *end);        // Prepara o index e as palavras
void init(std_busca *bM);          // inicia std_busca no estado inicial
void encontrarFFF(std_busca *bM);  // Resolvedor
int melhor_lin_ou_col(std_busca *bM, bool *eh_lin, int *pos);
bool tenta_palavra(std_busca *bM, bool eh_lin, int pos, int id);
void bitcpy(bitmap *a, const uint64_t *b);
int bitmap_tem(bitmap *b, int id);
void bitmap_clear(bitmap *b);
void bitmap_set(bitmap *b, int id);
void fprintfM(char ss[QUANT_L][QUANT_L_C]);

int main()
{
  printf("t1\n");
  std_busca stdM;

  printf("t2\n");
  criar_index("5wASCII.txt");
  printf("t3\n");
  init(&stdM);
  printf("t4\n");
  encontrarFFF(&stdM);
  printf("t5\n");
  return 0;
}

void encontrarFFF(std_busca *bM)
{
  bool eh_lin;
  int pos, id;
  int quant = melhor_lin_ou_col(bM, &eh_lin, &pos);

  if(quant == SUCESSO) {
    fprintfM(bM->m.mtrx);
    return;  //TODO: imprimir em .txt
  }

  if(quant == FIM)
    return;

  bitmap *tent = eh_lin ? &bM->m.lin[pos] : &bM->m.col[pos];

  for(id = 0; id < TOTAL_P; id++) {

    if(!bitmap_tem(tent, id))
      continue;

    std_busca prox = *bM;

    if(tenta_palavra(&prox, eh_lin, pos, id))
      encontrarFFF(&prox);
  }
}

bool tenta_palavra(std_busca *bM, bool eh_lin, int pos, int id)
{
  int i, c;
  bitmap *tent = eh_lin ? &bM->m.lin[pos] : &bM->m.col[pos];

  bitmap_clear(tent);
  bitmap_set(tent, id);

  for(i = 0; i < QUANT_L; i++) {
    c = palavras[id][i] - 'a';

    if(eh_lin) {
      bM->m.mtrx[pos][i] = palavras[id][i];
      bitcpy(&bM->m.col[i], index_bit[pos][c]);

      if(count_set_bits(&bM->m.col[i]) == 0)
        return false;
    } else {
      bM->m.mtrx[i][pos] = palavras[id][i];
      bitcpy(&bM->m.lin[i], index_bit[pos][c]);
      
      if(count_set_bits(&bM->m.lin[i]) == 0)
        return false;
    }
  }

  if(eh_lin) 
    bM->lin_atual[pos] = true; 
  else 
    bM->col_atual[pos] = true;

  return true;
}

int melhor_lin_ou_col(std_busca *bM, bool *eh_lin, int *pos)
{
  int i, j, quant;
  int melhor = TOTAL_P + 1;
  bool tem = false;

  for(i = 0; i < QUANT_L; i++) {
    if(!bM->lin_atual[i]) {
      quant = count_set_bits(&bM->m.lin[i]);
      if(quant < melhor) {
        melhor = quant;
        *eh_lin = tem = true;
        *pos = i;
      }
    }

    if(!bM->col_atual[i]) {
      quant = count_set_bits(&bM->m.col[i]);
      if(quant < melhor) {
        melhor = quant;
        *eh_lin = false;
        tem = true;
        *pos = i;
      }
    }
  }

  return tem ? melhor : -1;
}

void init(std_busca *bM)
{
  int i, j = TOTAL_P % 64;
  uint64_t corretor = UINT64_MAX;

  corretor = (1ULL << j) - 1;

  memset(&bM->m, 0, sizeof(bM->m));

  for(i = 0; i < QUANT_L; i++) {
    bM->lin_atual[i] = bM->col_atual[i] = false;

    for(j = 0; j < TAM_BIT; j++) {
      if(j == TAM_BIT - 1) {
        bM->m.lin[i].bits[j] = bM->m.col[i].bits[j] = corretor;
      } else {
        bM->m.lin[i].bits[j] = bM->m.col[i].bits[j] = UINT64_MAX;
      }
    }
  }
}

void bitcpy(bitmap *a, const uint64_t *b)
{
  int i;
  for(i = 0; i < TAM_BIT; i++) {
    a->bits[i] &= b[i];
  }
}

void bitmap_clear(bitmap *b)
{
  memset(b, 0, sizeof(*b));
}

void bitmap_set(bitmap *b, int id)
{
  b->bits[id / 64] |= 1ULL << (id % 64);
}

int bitmap_tem(bitmap *b, int id)
{
  return (b->bits[id / 64] & (1ULL << id % 64)) != 0;
}

int count_set_bits(bitmap *n)
{
  int i, count = 0;
  uint64_t ref;
  for(i = 0; i < TAM_BIT; i++) {
    ref = n->bits[i];
    while(ref != 0) {
      ref &= (ref - 1);
      count++;
    }
  }
  return count;
}

void add_index(char *s, int id)
{
  int i, j;
  for(i = 0; i < QUANT_L; i++) {
    j = s[i] - 'a';
    index_bit[i][j][id / 64] |= (1ULL << (id % 64));
  }
}

int criar_index(char *end)
{
  FILE *arq;
  char *s;
  char linha[7];
  int i = 0;

  if((arq = fopen(end, "r")) == NULL) {
    return 0;
  }

  while(fgets(linha, sizeof(linha), arq) != NULL) {
    linha[strcspn(linha, "\r\n")] = '\0';
    /*
    if(i > TOTAL_P) {
      fclose(arq);
      return 0;
    }
    */
    if(strlen(linha) != 5)
      continue;

    strcpy(palavras[i], linha);
    add_index(palavras[i], i);
    i++;
    //add_index(palavras[i], i);
    //i++;
  };

  fclose(arq);
  return 1;
}

void fprintfM(char ss[QUANT_L][QUANT_L_C])
{
  static FILE *arq;
  int i;
  
  if(arq == NULL) {
    arq = fopen("s.txt", "w");

    if(arq == NULL) {
      perror("solucoes.txt");
      return;
    }
  }

  for(i = 0; i < QUANT_L; i++) {
    fprintf(arq, "%s\n", ss[i]);
  }
  fputc('\n', arq);
  fflush(arq);
}
