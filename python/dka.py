from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import sys

app = Flask(__name__)

# Function to load existing user data
def load_user_data(filepath):
    data = pd.read_excel(filepath, header=0)  # Use the first row as the header
    # Reset user IDs to start from 1
    data['user_id'] = range(1, len(data) + 1)
    # Check if additional columns exist in the DataFrame
    for column in ['Nutrition and Diet', 'Routine Physical Activities', 'Self-care', 'Psycho-social Care']:
        if column not in data.columns:
            data[column] = 'missing'  # Add columns filled with 'missing' values if not present
    return data

# Function to preprocess data to handle missing values and ensure correct data types
def preprocess_data(data):
    # Ensure categorical data is treated as strings
    categorical_columns = ['gender', 'diabetes_type', 'Smokes', 'area']
    for column in categorical_columns:
        data[column] = data[column].astype(str)

    # Fill missing values
    data.fillna({
        'age': data['age'].median(),
        'gender': 'missing',
        'diabetes_type': 'missing',
        'Smokes': 'missing',
        'area': 'missing',
        'Nutrition and Diet': 'missing',
        'Routine Physical Activities': 'missing',
        'Self-care': 'missing',
        'Psycho-social Care': 'missing'
    }, inplace=True)

    return data

# Rule-based recommendation function
def apply_health_rules(user_profile):
    recommendations = []
    # Add unconditional recommendations
    recommendations.append("Replace sugary drinks like 'juices' with water.")
    recommendations.append("Don't forget to use enough insulin.")
    recommendations.append("Stay informed about diabetes research and advancements in treatment options.")
    recommendations.append("It is necessary to commit to monitoring blood pressure at home.")
    recommendations.append("Don't forget to conduct periodic checks on your psychological condition.")

    if user_profile['diabetes_type'] == 'Type 2':
        recommendations.append("Stop eating carbohydrates.")
    if user_profile['Smokes'] == 'Yes':
        recommendations.append("Cut down on smoking.")
    else:
        recommendations.append("Never start smoking.")
    if user_profile['gender'] == 'Female':
        recommendations.append("See the doctor regularly for check-ups.")
    if user_profile['age'] <= 30:
        recommendations.append("Do muscle exercises.")
    elif 40 <= user_profile['age'] <= 50:
        recommendations.append("Walk regularly.")
    elif user_profile['age'] > 50:
        recommendations.append("Practice yoga.")
    return recommendations

# Function to find users similar to the new user and identify the most similar user
def find_similar_users(data, new_user, threshold=0.7):
    # Initialize columns
    columns = ['Nutrition and Diet', 'Routine Physical Activities', 'Self-care', 'Psycho-social Care']
    past_interaction_columns = {col: None for col in columns}
    past_interaction_rating_columns = {col+'_rating': None for col in columns}

    numeric_features = ['age']
    categorical_features = ['gender', 'diabetes_type', 'Smokes', 'area']

    # Define column transformations
    ct = ColumnTransformer([
        ('num', Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ]), numeric_features),
        ('cat', Pipeline([
            ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
            ('onehot', OneHotEncoder(handle_unknown='ignore'))
        ]), categorical_features)
    ], remainder='drop')  # Exclude non-numeric features

    # Preprocess the new user data
    new_user_df = pd.DataFrame([new_user])
    new_user_df = preprocess_data(new_user_df)

    # Preprocess the existing data
    data = preprocess_data(data)

    # Reset indices
    data.reset_index(drop=True, inplace=True)

    # Preprocess combined data
    combined_data = pd.concat([data.drop('user_id', axis=1), new_user_df], ignore_index=True)

    # Exclude the last row (new user) from the combined data before feature transformation
    feature_matrix = ct.fit_transform(combined_data[:-1])

    # Compute cosine similarities between the new user and existing users
    similarities = cosine_similarity(feature_matrix[:-1], feature_matrix[-1].reshape(1, -1)).flatten()

    # Find indices of users with similarity above the threshold, excluding the last row (which is the new user)
    similar_users_indices = np.where(similarities >= threshold)[0]

    if len(similar_users_indices) > 0:
        # Sort similar users based on similarity score (highest to lowest)
        sorted_indices = np.argsort(-similarities[similar_users_indices])
        similar_users_indices_sorted = similar_users_indices[sorted_indices]

        # Get similar users data and similarity scores
        similar_users = data.iloc[similar_users_indices_sorted]
        most_similar_user = similar_users.iloc[0]

        # Filter past interactions for similar users
        for col in columns:
            if col in data.columns:
                past_interaction_columns[col] = data[col].iloc[similar_users_indices_sorted]
                past_interaction_columns[col].reset_index(drop=True, inplace=True)

        # Filter past interaction ratings for similar users
        for col in past_interaction_rating_columns.keys():
            col_name = col.replace('_rating', '')
            if col_name in data.columns:
                past_interaction_rating_columns[col] = data[col].iloc[similar_users_indices_sorted]
                past_interaction_rating_columns[col].reset_index(drop=True, inplace=True)

    else:
        similar_users = pd.DataFrame(columns=data.columns)  # Empty DataFrame
        most_similar_user = None

    return similar_users, most_similar_user, past_interaction_columns, past_interaction_rating_columns


def most_repeated_recommendation(recommendations):
    unique_recommendations, counts = np.unique(recommendations, return_counts=True)
    most_repeated_index = np.argmax(counts)
    return unique_recommendations[most_repeated_index]

def main():
    filepath = 'C:\\Users\\DELL\\Downloads\\dataset.xlsx'
    try:
        data = load_user_data(filepath)
        data = preprocess_data(data)  # Preprocess to ensure consistent data types and handle missing values
        
        age = int(sys.argv[1])
        gender = sys.argv[2]
        diabetesType = sys.argv[3]
        is_smoke = sys.argv[4]
        area = sys.argv[5]

        # Find the maximum user_id in the dataset and increment by 1 for the new user
        new_user_id = data['user_id'].max() + 1
        
        new_user = {
            'user_id': new_user_id,
            'age': age,
            'gender': gender,
            'diabetes_type': diabetesType,
            'Smokes': is_smoke,
            'area': area,
        }

        initial_recommendations = apply_health_rules(new_user)

        similar_users, most_similar_user, past_interaction_columns, past_interaction_rating_columns = find_similar_users(data, new_user)
        print("Similar users ID:")
        if most_similar_user is not None:
            print(similar_users['user_id'].tolist())
        else:
            print("No similar users found.")

        # Construct output with recommendations and ratings
        output = "\nThe recommendations are:"
        recommendations_with_past_interactions = initial_recommendations

        # Process recommendations from apply_health_rules
        apply_health_recommendations = {
            'Nutrition and Diet': [],
            'Routine Physical Activities': [],
            'Self-care': [],
            'Psycho-social Care': []
        }
        for recommendation in initial_recommendations:
            # Extract recommendation type
            recommendation_type = None
            if "Replace sugary drinks like 'juices' with water" in recommendation:
                recommendation_type = 'Nutrition and Diet'
            elif "Stop eating carbohydrates" in recommendation:
                recommendation_type = 'Nutrition and Diet'
            elif "Do muscle exercises" in recommendation:
                recommendation_type = 'Routine Physical Activities'
            elif "Walk regularly" in recommendation:
                recommendation_type = 'Routine Physical Activities'
            elif "Practice yoga" in recommendation:
                recommendation_type = 'Routine Physical Activities'
            elif "Don't forget to use enough insulin" in recommendation:
                recommendation_type = 'Self-care'
            elif "Stay informed about diabetes research and advancements in treatment options" in recommendation:
                recommendation_type = 'Self-care'
            elif "It is necessary to commit to monitoring blood pressure at home" in recommendation:
                recommendation_type = 'Self-care'
            elif "Cut down on smoking" in recommendation:
                recommendation_type = 'Self-care'
            elif "Never start smoking" in recommendation:
                recommendation_type = 'Self-care'
            elif "See the doctor regularly for check-ups" in recommendation:
                recommendation_type = 'Self-care'
            elif "Don't forget to conduct periodic checks on your psychological condition" in recommendation:
                recommendation_type = 'Psycho-social Care'

            if recommendation_type:
                apply_health_recommendations[recommendation_type].append(recommendation)

        # Add recommendations for each category
        for col, past_interaction_column in past_interaction_columns.items():
            output += f"\n\n* {col}:"
            unique_recommendations = set()
            if past_interaction_column is not None:
                ratings = []
                for recommendation, rating in zip(past_interaction_column, past_interaction_rating_columns[col + '_rating']):
                    if recommendation != 'missing' and recommendation not in unique_recommendations:
                        if len(past_interaction_column[past_interaction_column == recommendation]) > 1:
                            # Calculate the average rating for recommendations with the same area
                            area_ratings = past_interaction_rating_columns[col + '_rating'][data['area'] == area]
                            if len(area_ratings) > 0:
                                avg_rating_area = np.nanmean(area_ratings)  # Calculate average rating ignoring NaN values
                            else:
                                avg_rating_area = np.nan
                            if np.isnan(avg_rating_area):
                                avg_rating_area = 0  # Set NaN to 0
                            output += f"\n- {recommendation} (Rating: {avg_rating_area:.1f}/5)"
                        else:
                            if np.isnan(rating):
                                rating = 0  # Set NaN to 0
                            output += f"\n- {recommendation} (Rating: {rating:.1f}/5)"
                        unique_recommendations.add(recommendation)

            # Add recommendations from apply_health_rules
            if col in apply_health_recommendations:
                for recommendation in apply_health_recommendations[col]:
                    output += f"\n- {recommendation}"
                    # Add most recommended one for similar users
            most_repeated = most_repeated_recommendation(past_interaction_column)
            if most_repeated != 'missing':
                output += f"\nMost recommended in your area: {most_repeated}"

        print(output)  # Print the constructed output with recommendations and ratings

        # Check if the user already exists in the dataset based on age, gender, diabetes type, smoking status, and area
        if ((data['age'] == age) & (data['gender'] == gender) & (data['diabetes_type'] == diabetesType) & 
            (data['Smokes'] == is_smoke) & (data['area'] == area)).any():
            #print("This user already exists in the dataset.")
            return
        else:   
            # Add the new user to the DataFrame
            new_user_df = pd.DataFrame([new_user])
            new_user_df = preprocess_data(new_user_df)
            data = pd.concat([data, new_user_df], ignore_index=True)
            data.to_excel(filepath, index=False)

    except FileNotFoundError:
        print(f"The file was not found at {filepath}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__": 
    main()