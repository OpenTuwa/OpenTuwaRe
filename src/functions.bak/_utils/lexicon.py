import re
import json
from collections import Counter
import sys

# ==============================================================================
# 1. THE CORTEX: ADVANCED LEXICAL ENGINE (Python Translation)
# ==============================================================================

class PorterStemmer:
    def __init__(self):
        self.step2list = {
            "ational": "ate", "tional": "tion", "enci": "ence", "anci": "ance",
            "izer": "ize", "bli": "ble", "alli": "al", "entli": "ent",
            "eli": "e", "ousli": "ous", "ization": "ize", "ation": "ate",
            "ator": "ate", "alism": "al", "iveness": "ive", "fulness": "ful",
            "ousness": "ous", "aliti": "al", "iviti": "ive", "biliti": "ble",
            "logi": "log"
        }

        self.step3list = {
            "icate": "ic", "ative": "", "alize": "al", "iciti": "ic",
            "ical": "ic", "ful": "", "ness": ""
        }

    def is_consonant(self, s, i):
        char = s[i]
        if char in "aeiou": return False
        if char == 'y':
            if i == 0: return True
            return not self.is_consonant(s, i - 1)
        return True

    def measure(self, s):
        n = 0
        index = 0
        length = len(s)
        while index < length:
            if not self.is_consonant(s, index): break
            index += 1
        while index < length:
            while True:
                if index >= length: return n
                if self.is_consonant(s, index): break
                index += 1
            index += 1
            n += 1
            while True:
                if index >= length: return n
                if not self.is_consonant(s, index): break
                index += 1
        return n

    def contains_vowel(self, s):
        for i in range(len(s)):
            if not self.is_consonant(s, i): return True
        return False

    def ends_with_double_consonant(self, s):
        length = len(s)
        if length < 2: return False
        if s[length - 1] != s[length - 2]: return False
        return self.is_consonant(s, length - 1)

    def cvc(self, s):
        length = len(s)
        if length < 3: return False
        if self.is_consonant(s, length - 1) and not self.is_consonant(s, length - 2) and self.is_consonant(s, length - 3):
            w = s[length - 1]
            if w in ['w', 'x', 'y']: return False
            return True
        return False

    def stem(self, w):
        if len(w) < 3: return w
        first_char = w[0]
        if first_char == 'y': w = 'Y' + w[1:]

        if w.endswith("sses"): w = w[:-2]
        elif w.endswith("ies"): w = w[:-2]
        elif w.endswith("ss"): w = w
        elif w.endswith("s"): w = w[:-1]

        if w.endswith("eed"):
            stem_str = w[:-3]
            if self.measure(stem_str) > 0: w = stem_str + "ee"
        else:
            stem_str = ""
            if w.endswith("ed"):
                stem_str = w[:-2]
                if self.contains_vowel(stem_str):
                    w = stem_str
                    if w.endswith("at") or w.endswith("bl") or w.endswith("iz"): w += "e"
                    elif self.ends_with_double_consonant(w) and w[-1] not in ["l", "s", "z"]:
                        w = w[:-1]
                    elif self.measure(w) == 1 and self.cvc(w): w += "e"
            elif w.endswith("ing"):
                stem_str = w[:-3]
                if self.contains_vowel(stem_str):
                    w = stem_str
                    if w.endswith("at") or w.endswith("bl") or w.endswith("iz"): w += "e"
                    elif self.ends_with_double_consonant(w) and w[-1] not in ["l", "s", "z"]:
                        w = w[:-1]
                    elif self.measure(w) == 1 and self.cvc(w): w += "e"

        if w.endswith("y") and self.contains_vowel(w[:-1]):
            w = w[:-1] + "i"

        if self.measure(w) > 0:
            for suffix, replacement in self.step2list.items():
                if w.endswith(suffix):
                    stem_str = w[:-len(suffix)]
                    if self.measure(stem_str) > 0: w = stem_str + replacement
                    break

        if self.measure(w) > 0:
            for suffix, replacement in self.step3list.items():
                if w.endswith(suffix):
                    stem_str = w[:-len(suffix)]
                    if self.measure(stem_str) > 0: w = stem_str + replacement
                    break

        if self.measure(w) > 1:
            suffixes = ["al", "ance", "ence", "er", "ic", "able", "ible", "ant", "ement", "ment", "ent", "ou", "ism", "ate", "iti", "ous", "ive", "ize"]
            for suffix in suffixes:
                if w.endswith(suffix):
                    stem_str = w[:-len(suffix)]
                    if self.measure(stem_str) > 1: w = stem_str
                    break
            if w.endswith("ion"):
                stem_str = w[:-3]
                if self.measure(stem_str) > 1 and (stem_str.endswith("s") or stem_str.endswith("t")): w = stem_str

        if self.measure(w) > 1 and w.endswith("e"): w = w[:-1]
        elif self.measure(w) == 1 and not self.cvc(w) and w.endswith("e"): w = w[:-1]

        if self.measure(w) > 1 and self.ends_with_double_consonant(w) and w.endswith("l"): w = w[:-1]

        if first_char == 'y': w = 'y' + w[1:]
        return w

class NGramTokenizer:
    def __init__(self, stop_words_set):
        self.stop_words = stop_words_set if stop_words_set else set()
        self.stemmer = PorterStemmer()

    def tokenize(self, text):
        if not text: return []
        
        # Exact regex replacements from JS logic
        clean_text = re.sub(r'&[a-z0-9#]+;', ' ', text, flags=re.IGNORECASE)
        clean_text = re.sub(r'<[^>]*>?', ' ', clean_text)
        clean_text = clean_text.lower()
        clean_text = re.sub(r'[^\w\s]|_', ' ', clean_text)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()

        raw_words = [w.strip() for w in clean_text.split(' ') if len(w.strip()) > 2 and w.strip() not in self.stop_words]
        stemmed_words = [self.stemmer.stem(w) for w in raw_words]
        
        tokens = list(stemmed_words)

        # Bigrams
        for i in range(len(stemmed_words) - 1):
            tokens.append(f"{stemmed_words[i]} {stemmed_words[i+1]}")

        # Trigrams
        for i in range(len(stemmed_words) - 2):
            tokens.append(f"{stemmed_words[i]} {stemmed_words[i+1]} {stemmed_words[i+2]}")

        return tokens


# ==============================================================================
# 2. CONSTANTS AND GENERATOR FUNCTION
# ==============================================================================

# Ported exact STOP_WORDS from JS
STOP_WORDS = {
  'a','about','above','after','again','against','all','am','an','and','any','are','aren','as','at','be','because','been','before','being','below','between','both','but','by','can','cannot','could','did','didn','do','does','doesn','doing','don','down','during','each','few','for','from','further','had','hadn','has','hasn','have','haven','having','he','her','here','hers','herself','him','himself','his','how','i','if','in','into','is','isn','it','its','itself','me','more','most','must','my','myself','no','nor','not','of','off','on','once','only','or','other','ought','our','ours','ourselves','out','over','own','same','shan','she','should','shouldn','so','some','such','than','that','the','their','theirs','them','themselves','then','there','these','they','this','those','through','to','too','under','until','up','very','was','wasn','we','were','weren','what','when','where','which','while','who','whom','why','will','with','won','would','wouldn','you','your','yours','yourself','yourselves', 'div', 'class', 'span', 'p', 'br', 'strong', 'em', 'img', 'src', 'href'
}

def generate_lexical_matrix(text):
    if not text:
        return '{}'
    
    tokenizer = NGramTokenizer(STOP_WORDS)
    tokens = tokenizer.tokenize(text)
    
    # Calculate frequencies
    matrix = Counter(tokens)
    
    # Sort by frequency descending, take top 50, and format as dictionary
    # Counter.most_common() returns a list of tuples like [('word', count)]
    top_50 = dict(matrix.most_common(50))
    
    # Return stringified JSON just like the JS version
    return json.dumps(top_50, ensure_ascii=False)

# ==============================================================================
# 3. FILE EXECUTION
# ==============================================================================

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python lexical_generator.py <lex.txt>")
        sys.exit(1)

    file_path = sys.argv[1]
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        json_matrix = generate_lexical_matrix(content)
        
        print(f"--- Top 50 Lexical Matrix for {file_path} ---")
        print(json_matrix)
        
    except FileNotFoundError:
        print(f"Error: Could not find the file '{file_path}'")
    except Exception as e:
        print(f"An error occurred: {e}")