import argparse

def count_words(text):
    return len(text.split())

def count_characters(text):
    text = text.lower()
    char_counts = {}
    for char in text:
        if char.isalpha():
            char_counts[char] = char_counts.get(char, 0) + 1
    return char_counts

def get_book_text(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def main():
    parser = argparse.ArgumentParser(description='Analyze text files')
    parser.add_argument('path', help='Path to text file')
    args = parser.parse_args()
    
    text = get_book_text(args.path)
    word_count = count_words(text)
    char_counts = count_characters(text)
    
    print(f"--- Begin report of {args.path} ---")
    print(f"{word_count} words found in the document\n")
    
    sorted_chars = sorted(char_counts.items(), key=lambda x: x[1], reverse=True)
    for char, count in sorted_chars:
        print(f"The '{char}' character was found {count} times")
    
    print("\n--- End report ---")

if __name__ == "__main__":
    main()